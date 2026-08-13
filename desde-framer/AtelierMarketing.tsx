// AtelierMarketing.tsx v1.33 — LOTE F: el perfil propio se pide por el edge `me` y la membresía por el gateway user-action (auditoría 2026-07-27)
// v1.31 — Default "Solo prompts" ($0) en VEO Instagram (es el modo que más usamos), antes era "Con API".
// v1.30 — RPC admin por gateway admin-action (cierra IDOR de la familia Atelier, barrido 2026-06-13)
// v1.29 — Selector de cantidad (1/2/3) en VEO Instagram (toggle "Cantidad").
// v1.28 — Ola C #3: cada llamada a edge del Atelier manda el token de Clerk verificado.
// v1.27 — La pestaña activa se recuerda entre recargas (localStorage): si
//         recargas estando en "Zak'Haar Posts", reabre ahí mismo.
// v1.26 — "Zak'Haar Posts" deja de ser placeholder: ahora monta el motor de
//         CARRUSELES (AT_ZakHaarCarrusel.tsx). Selector de 3 estilos de marca
//         (Códice de Silicio · Tablilla Solar · Vitral Cuántico) + número de
//         slides 5-8, modo solo-prompts ($0). Pareja del edge
//         generate-zakhaar-carousel v1.0 + migración 20260606_zakhaar_carruseles.sql.
// v1.25 — Reordenamiento de pestañas Zak'Haar: (a) se quitó la pestaña vieja
//         "ZakHaar Video" (Seedance, ya no se usa). (b) "Estudio Manual" se
//         renombró a "Zak'Haar Video" (es el generador vigente). (c) Nueva pestaña
//         "Zak'Haar Posts" (carruseles) con estado "en construcción" — el motor se
//         arma en la próxima Sala de Comando. Las claves internas no cambian
//         (estudio_manual sigue siendo estudio_manual).
// v1.24 — TEMA CLARO "VTLI" (estilo veotuluzinterna.com): lienzo crema/pastel
//         claro con auroras suaves, tarjetas blancas con sombra limpia, botones
//         que destacan (relleno dorado), texto en tinta. Override al final del CSS.
//         + Botón "Resubir" en posts manuales para reemplazar una imagen subida.
//         Solo UI.
// v1.23 — Reskin visual del Atelier: fondo "Amanecer Solar" (auroras cálidas
//         dorado/coral/teal/lavanda que derivan lento) en vez del campo de
//         estrellas oscuro, para TODO el Atelier (todas las sub-pestañas). Tarjetas
//         y tiles pasan a vidrio esmerilado cálido. Solo UI (sin tocar lógica).
// v1.22 — Nueva sección SOMA CERO. Sub-tab "Soma Cero" que renderiza el hermano
//         AT_SomaCero.tsx (posts de Instagram de alimentos de alta conductividad,
//         Cancún): generación API + modo solo prompts, igual que VTLI Instagram
//         pero sin video/reels. Backend propio: tabla soma_posts + edge
//         generate-soma-posts (migración 20260603c).
// v1.21 — MODO MANUAL + PORTADA en los posts VTLI. Toggle "Con API / Solo
//         prompts" arriba de los botones (Solo prompts = $0, el motor solo da el
//         prompt para Nano Banana). En modo manual el card muestra el prompt +
//         caja para subir tu imagen final; al subirla, oculta el prompt y muestra
//         la pieza con acciones Publicado / Descargar / Texto / Borrar (sin reroll
//         ni aprobar). Edge generate-vtli-posts v3.6 + upload-vtli-post-image +
//         migración 20260603b. También: CTA fijo de Cancún (4 sesiones) en todos
//         los posts.
// v1.20 — Sub-tab "Estudio Manual": storyboards de keyframes consistentes
//         (misma cara) para animar en Grok Imagine. El render se delega al
//         hermano AT_EstudioManual.tsx (archivo NUEVO · default export). El
//         shell solo suma el tipo de sub-tab, el botón y el passthrough de
//         supabaseUrl/anonKey/userId. Requiere migración 20260530_vtli_drafts
//         + edge functions generate-vtli-storyboard, animate-vtli-keyframe y
//         subir-keyframe-video DEPLOYED.
// v1.19 — Fila de conteos del dashboard colapsada por defecto, tras el
//         botón "Número de posts emitidos" (se despliega al picarlo).
// v1.18 — Botones de descarga (imagen/banner/video) bajan el archivo en
//         1 click vía el proxy `descargar-media`. El dominio r2.dev no
//         aplica CORS, así que el fetch fallaba con "Failed to fetch"
//         (aunque <img> sí mostraba). El proxy lo trae server-side y lo
//         devuelve con Content-Disposition: attachment → descarga directa.
// v1.17 — REROLL FORMATO (preserva concepto) + RENAME VTLI VIDEO.
//         Caso Zak 2026-05-27: el primer banner Telekinesis cerró un
//         feed 4:5 PERFECTO pero su stories 9:16 salió fuera de
//         paleta. Antes el botón "↻ Reroll" del card regeneraba el
//         CONCEPTO ENTERO (nuevo hook, dos banners nuevos) — perdías
//         el feed que te gustaba. Cambios:
//          · El botón "↻ Reroll" del BannerCard pasa a ser "↻ Reroll
//            formato": preserva concepto (hook, subtext, cta,
//            target, pulso, concept_id) y regenera SOLO el
//            prompt_visual del aspect ratio elegido + imagen.
//            Costo: ~$0.07 USD (1 imagen).
//          · El reroll del CONCEPTO completo (caso menos frecuente)
//            queda accesible desde un botón secundario en el heading
//            del current batch ("↻ Reroll concepto completo (2
//            banners nuevos)"). Costo: ~$0.13 USD (2 imágenes).
//          · Handler nuevo handleRerollBannerFormat que invoca el
//            modo reroll_format_only_for_banner_id del edge function
//            v1.2.
//          · Sub-tab "VEO Video" renombrado a "VTLI Video"
//            (consistente con "VTLI Instagram" + "VTLI Banners").
//         Requiere edge function generate-vtli-banners v1.2
//         DEPLOYED.
//
// v1.16 — PIVOTE A 2 FORMATOS INSTAGRAM + RENAME + LENGUAJE COLD.
//         Cambios discutidos con Zak 2026-05-27:
//          · Eliminado fb_landscape (publicidad solo Instagram).
//          · feed_square (1:1) reemplazado por feed_portrait (4:5
//            1080×1350) que es el máximo vertical que Instagram
//            permite sin cropping automático.
//          · Por click ahora son 2 banners (no 3). Costo por click:
//            2 × $0.067 = $0.13 USD/concepto.
//          · CTA URL en cada banner ya incluye UTM tags
//            automáticos para tracking de ganadoras en Meta Ads +
//            Analytics. La URL visible en el banner sigue siendo
//            "veotuluzinterna.com" porque el prompt_visual fue
//            generado con la base limpia.
//          · Sub-tab "VEO Instagram" renombrado a "VTLI Instagram"
//            para reflejar que cubre los 4 pilares (VEO,
//            Telekinesis, Calibración, Sintonía).
//          · System prompt del Director Creativo prohibe "Visión
//            Solar" en hooks de banners — solo "Visión Extra
//            Ocular" o "VEO" como puente cold al exterior.
//         Requiere migración SQL 20260527d_vtli_banners_format_pivot
//         APLICADA + edge function generate-vtli-banners v1.1
//         DEPLOYED.
//
// v1.15 — SUB-TAB "VTLI BANNERS" para publicidad Meta Ads. Universo
//         paralelo al sub-tab "VEO Instagram" pero con anatomía
//         ad-ready (hook directo + subtexto fijo + CTA + URL visible).
//         Cada click genera UN concepto creativo en 3 formatos
//         canónicos simultáneos:
//          · feed_square  · 1080×1080 · feed IG/FB
//          · stories_9x16 · 1080×1920 · Stories + Reels static
//          · fb_landscape · 1200×628  · FB ad landscape + sidebar
//         Costo por click: 3 × $0.067 = ~$0.13 USD. Budget Fase 1:
//         8-12 clicks (2-3 conceptos × 4 pilares) = $1.60-2.40 USD.
//         · Tipo VtliBanner + VtliBannerFormat + VtliBannerStatus +
//           AtelierBannersDashboard.
//         · Sub-tab "vtli_banners" agregado a SubTab union.
//         · BannerCard espejo de PostCard con campos extras (hook
//           overlay, subtext fijo, cta_label, format pill).
//         · 4 botones de generación (uno por pilar) en grid 2×2.
//         · Dashboard banners: 7 stats (4 pilares + 3 formatos).
//         · Filter histórico: pilar + formato + status.
//         · Polling unificado extendido para 3er universo (banners
//           pending) además de imágenes y videos.
//         · Reroll de concepto completo (3 banners nuevos con nuevo
//           concept_id) via reroll_of_concept_id.
//         · Botón "Publicar" idéntico al de posts: marca como
//           exportado a Meta Ads Manager, sale del feed activo.
//         Requiere migración SQL 20260527c_vtli_banners aplicada +
//         edge function generate-vtli-banners DEPLOYED.
//
// v1.14 — BOTÓN "PUBLICAR" en cards aprobados. Cuando el post ya está
//         en status='approved', el botón "✓ Aprobar" se reemplaza por
//         "↗ Publicar" (mismo slot, color dorado). Al picarlo, el card
//         pasa a status='published' y el filtro "Publicados" del
//         histórico empieza a mostrarlo. Patrón aplicable también a
//         VideoCard para simetría — Zak descarga + sube manual a
//         Instagram, después marca el card en el panel para limpiar el
//         feed activo. Sin esto los aprobados acumulaban en pantalla
//         indefinidamente y el filtro "Publicados" quedaba inerte.
//         · PostCardProps + VideoCardProps suman onPublish:()=>void.
//         · Renders del currentBatch + filteredHistory + currentVideo +
//           filteredVideoHistory pasan onPublish wireado al RPC
//           update_vtli_post_status / update_vtli_video_status con
//           valor 'published' (ambos RPCs ya validan ese estado desde
//           la migración original 20260526).
//
// v1.13 — CALIBRACIÓN BIOLÓGICA + SINTONÍA DE NÚCLEO sumadas al sub-tab
//         "VEO Instagram". Ahora el panel genera posts Instagram para
//         los 4 pilares VTLI desde el mismo lugar. Cambios:
//          · Tipo VtliCategory extendido a 4 valores ('veo' |
//            'telekinesis' | 'calibracion' | 'sintonia').
//          · AtelierDashboard suma 2 counts mensuales nuevos
//            (month_generated_calibracion + month_generated_sintonia).
//          · 4 stats en el dashboard del mes (uno por pilar) en lugar
//            de 2. Stripe horizontal sigue cabiendo: en desktop el
//            grid auto-fit acomoda 4 columnas; en mobile 2×2.
//          · Sub-tab "VEO Instagram" pasa de 2 → 4 botones de
//            generación (grid 2×2 desktop, 1col mobile). Glyphs
//            ◈ (VEO) · ◇ (Telekinesis) · ⬡ (Calibración) · ⬢ (Sintonía).
//            Costo por click = 3 imágenes × $0.067 = $0.20 USD; un
//            catálogo completo del pilar son 2 clicks (~$0.40 USD).
//          · 2 tints nuevos para las pills de categoría en los cards
//            (CALIBRACION_TINT pastel verde-glaciar, SINTONIA_TINT
//            pastel violeta-helado). Mantienen la paleta VTLI fría.
//          · Filter histórico extendido: 5 botones de categoría
//            (Todas · VEO · Telekinesis · Calibración · Sintonía).
//          · PostCard catLabel + catClass mapean los 4 valores con
//            switch dentro del componente.
//         Requiere migración SQL 20260527b_vtli_atelier_calibracion_sintonia
//         APLICADA + edge function generate-vtli-posts v3.4 DEPLOYED
//         antes de usar los botones nuevos (sino dispara 400
//         invalid_category).
//
// v1.12 — BOTÓN BORRAR CARD destacado en zona "Tiempo agotado / Video
//         falló". Caso Zak 2026-05-27: el video se generó en fal.ai
//         pero el card siguió mostrando "Tiempo agotado" porque el
//         waitUntil del backend murió antes del R2 upload. Zak quiso
//         borrar el card directo (sin rescatar ni regenerar) y tuvo
//         que bajar al pie del card para encontrar el ✕ Borrar.
//         Ahora el botón rojo tenue "✕ Borrar card" aparece JUNTO a
//         💎 Rescatar gratis y ↻ Generar nuevo, así Zak decide
//         consciente cuál de las 3 acciones tomar sin moverse.
//         Combinado con la migración SQL 20260527_vtli_soft_delete:
//         al borrar, el pulso_nucleo del Reel queda en memoria
//         anti-repetición (no se borra físicamente), así que el pilar
//         queda prohibido para los próximos N Reels aunque la card
//         haya desaparecido del panel.
//
// v1.11 — RESCATE GRATIS de videos perdidos. Cuando el waitUntil del
//         backend muere entre fal.ai COMPLETED y R2 upload, el video
//         queda generado (sin costo extra) en fal.ai por 24h. Caso Zak
//         2026-05-26 noche: video 019e68f3 (prompt cinematográfico
//         perfecto del primer cristal de silicio) quedó atascado en
//         "Tiempo agotado" mientras existía en fal.ai. Solución UI:
//         botón dorado pulsante "💎 Rescatar gratis" cuando el video
//         tiene replicate_prediction_id pero no video_r2_url. Debajo,
//         botón secundario tenue "↻ Generar nuevo ($3)" para si Zak
//         decide regenerar consciente (no auto). Backend modo nuevo
//         rescue_video_from_fal_for_video_id en generate-vtli-video v1.6.
//
// v1.10 — CIRCUITO DE GASTO. Eliminamos el auto-retry sweep de VIDEOS.
//         por completo. Cada video Standard 10s cuesta $3.03 USD; un
//         auto-retry × 5 puede consumir $15 USD en silencio si fal.ai
//         tarda más de 90s en responder al placeholder mientras el job
//         ya estaba corriendo. Caso Zak 2026-05-26 noche: dos invocaciones
//         consecutivas gastaron los $6.96 USD que quedaban en fal.ai,
//         generando 2 videos repetidos del mismo pilar (no había anti-
//         repetición real porque el RPC pulsos filtra por approved).
//         · Video pending: spinner sin contador, texto "Materializando ·
//           puede tomar 1-3 min".
//         · Si pasa más de VIDEO_STUCK_THRESHOLD_SEC (5 min) sin
//           video_r2_url → card muestra "Tiempo agotado" con botón
//           manual "↻ Reintentar video". Zak decide consciente cuando
//           gastar otros $3 USD.
//         · El sweep de polling sigue detectando cuando fal.ai termina
//           y populates video_r2_url, sin disparar nada automático.
//         IMÁGENES mantienen el auto-retry × 5 (cada imagen cuesta
//         $0.067 USD, el cupo de 5 retries es ~$0.34 USD worst case,
//         absorbible).
//
// v1.9 — HOTFIX bug del polling unificado. El tick hacía early return
//        cuando no había imágenes pending, sin importar si había
//        videos pending. Resultado: el sweep de videos nunca corría
//        si el usuario sólo había generado video sin imagen, dejando
//        el card eternamente en "Materializando" aunque fal.ai ya
//        hubiera completado el job en background. Fix: calcular
//        pendingImageIds + pendingVideoIds en paralelo y hacer early
//        return solo si AMBOS están vacíos. Cada sweep se ejecuta
//        independientemente según si tiene pending propios. Caso
//        Zak 2026-05-26: video 019e6683 completó en fal.ai con
//        status 200 a 191s pero el card seguía en "Materializando"
//        porque el polling nunca lo detectaba.
//
// v1.8 — Atelier de Video pasa a Seedance 2.0 STANDARD 10s con Códice
//        Maestro de Zak'Haar reescrito. Botones de generación reflejan
//        nuevo costo ($3.03 USD/video) + nueva duración + nuevo tiempo
//        esperado (60-120s vs 30-90s del Fast). VEO Video sigue
//        configurado pero hoy es prioridad 2 — el foco operativo es
//        el canal Zak'Haar Instagram (1 Reel/semana, Arquitecto de
//        Silicio, paleta nocturna cyan + dorado).
//
// v1.7 — ATELIER DE VIDEO con Seedance 2.0 (Replicate). Activamos los
//        dos sub-tabs "VEO Video" y "ZakHaar Video". Cada uno con UN
//        solo botón "Generar 1 video" (no batch — cada video cuesta
//        ~$0.90 USD vs $0.067 de las imágenes). Cards usan <video>
//        autoplay loop muted playsInline. Mismas 5 acciones por card.
//        Mismo polling unificado + auto-retry pattern (~30-90s típicos
//        de Seedance; threshold 90s con hasta 5 reintentos automáticos).
//        Edge function nueva: generate-vtli-video. RPCs nuevas:
//        get_recent_vtli_videos, get_vtli_videos_by_ids,
//        get_atelier_video_dashboard, update_vtli_video_status,
//        delete_vtli_video.
//
// v1.6 — AUTO-RETRY MÚLTIPLE a prueba de balas para el 3er card del batch.
//        Cambios anti-fallo:
//         · `autoRetriedRef`: Set<id> → Map<id, count>. Cada card puede
//           auto-reintentar hasta MAX_AUTO_RETRIES (5) veces consecutivas,
//           no UNA sola. Resuelve el caso donde el primer auto-retry
//           también moría (Gemini saturado / waitUntil corto / R2 lento).
//         · Threshold de detección de atasco: 3 min → 90 s. Más responsive.
//         · Después de cada auto-retry: incrementamos el contador y forzamos
//           re-render via `retryTick` para que el card muestre "Reintentando
//           N de 5..." en lugar de un genérico "Materializando".
//         · PostCard recibe `autoRetryCount` + `autoRetriesExhausted`. Si
//           los 5 reintentos automáticos se agotaron y la card sigue sin
//           imagen, mostramos el botón manual ↻ de inmediato (sin esperar
//           otros 90s). El usuario nunca queda esperando a ciegas.
//         · Cada auto-retry sigue siendo invocación FRESCA del worker con
//           su propio waitUntil (1 imagen sola → wall clock holgado).
//        Tiempo total worst case: ~8 min de auto-retry + botón manual.
//
// v1.4 — Botón "Reintentar imagen" en cards atascadas/falladas.
//        Llama al modo retry_image_only_for_post_id de
//        generate-vtli-posts v3.2 (regenera la imagen reusando el
//        prompt_visual existente sin tocar copy ni contadores).
//        Reset visual optimista del card: image_r2_url=null +
//        status=draft + generated_at=now para que vuelva al estado
//        "Materializando" en el polling. Aplica tanto a la tanda
//        actual como al historial.
//
// v1.3 — Batch baja de 5 a 3 para garantizar que las paralelas
//        siempre completen dentro del wall clock del waitUntil de
//        Supabase Edge. Si Zak quiere más, vuelve a picar el botón.
//        Fix temporal — vivir con batch de 3 mientras no aparece un
//        bloqueador que justifique reabrir el fan-out arquitectónico.
//
// v1.2 — Cards completas en historial (mismo PostCard que la tanda
//        actual, no thumbnails). Botón Borrar por card con
//        confirmación. Filtro "Incompletos" para ver pending +
//        rejected. Polling unificado que detecta pending tanto del
//        batch actual como del historial (sobrevive a recargas de
//        página). Cards atascadas >3min sin imagen muestran "Tiempo
//        agotado · Borrar y reintentar". Layout de 5 acciones por
//        card (Aprobar / Reroll / Imagen / Texto / Borrar).
//
// v1.1 — async pattern: la edge function devuelve placeholders
//        inmediato (image_r2_url=null) y las 5 imágenes se generan
//        en background. El panel hace polling cada 4s al RPC
//        get_vtli_posts_by_ids hasta que todas las URLs se populen.
//        Cards muestran spinner dorado pulsante mientras materializan.
//
// Atelier de Marketing — panel admin de generación de contenido VTLI
// para Instagram (5 VEO o 5 Telekinesis por click). Sub-tab inicial
// "VEO Instagram". Sub-tabs futuros (RSV Instagram, Reels Higgsfield,
// TikTok) se cuelgan del mismo shell.
//
// Flujo:
//   1. Admin gate (profiles.is_admin via get_profile_by_clerk_id).
//   2. Dashboard de contadores del mes + total histórico.
//   3. Botón [⚡ Generar 5 VEO] / [⚡ Generar 5 Telekinesis] →
//      POST a edge function generate-vtli-posts.
//   4. Grid de 5 cards con imagen 3:4 + caption + hashtags +
//      4 acciones por card: Aprobar, Reroll, Descargar imagen,
//      Copiar caption.
//   5. Historial 30 días al pie con filtros (categoría + estado).
//
// Property control NO requerido: Domo pasa supabaseUrl y
// supabaseAnonKey via case "/atelier" del switch principal.

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import NavRevealPin from "./NavRevealPin.tsx"
import AtelierEstudioManual from "./AT_EstudioManual.tsx"
import AtelierSomaCero from "./AT_SomaCero.tsx"
import AtelierZakHaarCarrusel from "./AT_ZakHaarCarrusel.tsx"

/* ═══════════════════════════════════════════════════════════════
   1. CONSTANTS + HELPERS
   ═══════════════════════════════════════════════════════════════ */

const GOLD = "#D4A843"
const CYAN = "#00e5ff"
const VEO_TINT = "#A9B7DA"
const TELE_TINT = "#B8C2DE"
// v1.13: 2 tints nuevos para los pilares Calibración Biológica + Sintonía
// de Núcleo. Mantienen la paleta VTLI fría (pastel azul-cielo, blancos
// cremosos, dorado suave). Calibración tira a verde-glaciar (depuración
// biológica, agua estructurada H3O2). Sintonía tira a violeta-helado
// (bypass al núcleo, antena interna). Las pills de categoría en los
// cards usan estos colores para diferenciar visualmente los 4 pilares.
const CALIBRACION_TINT = "#B8D4D0"
const SINTONIA_TINT = "#C7BFDE"
// v1.16: 2 tints para las pills de FORMAT del sub-tab VTLI Banners.
// Cada formato canónico de Instagram se distingue visualmente.
// FEED_TINT (azul cielo cálido) para feed_portrait 4:5 (1080×1350).
// STORIES_TINT (durazno helado) para stories_9x16 (1080×1920).
// (LANDSCAPE_TINT del v1.15 retirado junto con fb_landscape — Meta Ads
// solo Instagram desde 2026-05-27.)
const FEED_TINT = "#9CC4E4"
const STORIES_TINT = "#E8B89B"

// v1.6: auto-retry tuning para IMÁGENES. Threshold corto (90s) para
// detectar atascos rápido + hasta MAX_AUTO_RETRIES (5) reintentos
// automáticos consecutivos antes de mostrar el botón manual. Cada retry
// es invocación FRESCA del worker con su propio waitUntil — una sola
// imagen casi siempre completa. Costo máximo de los 5 retries: ~$0.34 USD.
const AUTO_RETRY_THRESHOLD_SEC = 90
const MAX_AUTO_RETRIES = 5

// v1.10: VIDEO NO TIENE AUTO-RETRY. Cada video Standard 10s cuesta
// $3.03 USD; 5 retries consumirían $15 USD en silencio. Threshold de
// 5 min sin video_r2_url → card muestra botón manual "↻ Reintentar
// video". Zak decide consciente cuando gastar otros $3 USD. El sweep
// de polling sigue detectando cuando fal.ai termina sin disparar nada.
const VIDEO_STUCK_THRESHOLD_SEC = 300

const hx = (hex: string, a = 1) => {
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
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

/* Perfil propio verificado vía edge `me`: el clerk id sale del claim `sub`
   del token de sesión firmado, nunca de un param del body. Reemplaza al
   oráculo get_profile_by_clerk_id (REVOKE del Lote F, 20260727e). */
async function fetchMe(url: string, key: string) {
    if (!url || !key) return null
    try {
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (!token) return null
        const r = await fetch(`${url}/functions/v1/me`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ token }),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

/* 🜂 v2.x — MISMA CURA QUE EL MOTOR (MI_Shared v1.7). El portón hacía UN
   solo intento a los 300ms y leía cualquier tropiezo —Clerk todavía
   despertando, un token frío, un traspié de red— como "no tenés permiso",
   para siempre. Ahora INSISTE con esperas crecientes hasta que el servidor
   conteste de verdad; solo el servidor puede decir que no. Se conserva
   local (este archivo no importa de MI_Shared) pero es la misma lógica. */
const REINTENTOS_ADMIN = [
    0, 180, 320, 500, 750, 1100, 1500, 2000, 2600, 3200, 4000,
]

function useAdminAuth(url: string, key: string) {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState("")
    const [intentoManual, setIntentoManual] = useState(0)
    useEffect(() => {
        let cancelado = false
        let timer: any = null
        setLoading(true)
        const verificar = async (paso: number) => {
            if (cancelado) return
            const clerk = (window as any).Clerk
            const clerkId = clerk?.user?.id
            /* Sesión cerrada de verdad: Clerk terminó y no hay nadie. */
            if (clerk?.loaded === true && !clerkId) {
                setIsAdmin(false)
                setLoading(false)
                return
            }
            if (clerkId && !cancelado) setUserId(clerkId)
            if (clerkId && url && key) {
                let respondio = false
                let esAdmin = false
                try {
                    const r = await fetchMe(url, key)
                    if (r && typeof r === "object") {
                        respondio = true
                        esAdmin = (r as any).is_admin === true
                    }
                } catch {}
                if (cancelado) return
                if (respondio) {
                    setIsAdmin(esAdmin)
                    setLoading(false)
                    return
                }
            }
            const siguiente = paso + 1
            if (siguiente < REINTENTOS_ADMIN.length) {
                timer = setTimeout(
                    () => verificar(siguiente),
                    REINTENTOS_ADMIN[siguiente]
                )
                return
            }
            setIsAdmin(false)
            setLoading(false)
        }
        timer = setTimeout(() => verificar(0), REINTENTOS_ADMIN[0])
        return () => {
            cancelado = true
            if (timer) clearTimeout(timer)
        }
    }, [url, key, intentoManual])
    useEffect(() => {
        if (typeof window === "undefined") return
        const alCambiar = () => setIntentoManual((n) => n + 1)
        window.addEventListener("rsv-auth-changed", alCambiar)
        return () => window.removeEventListener("rsv-auth-changed", alCambiar)
    }, [])
    return { isAdmin, loading, userId }
}

function useIsMobile() {
    const [m, setM] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const check = () => {
            const ua =
                typeof navigator !== "undefined" ? navigator.userAgent : ""
            const uaMobile = /iPhone|iPod|(Android[\s\S]*?Mobile)/i.test(ua)
            setM(uaMobile || window.innerWidth < 768)
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])
    return m
}

/* ═══════════════════════════════════════════════════════════════
   2. TYPES
   ═══════════════════════════════════════════════════════════════ */

type VtliCategory = "veo" | "telekinesis" | "calibracion" | "sintonia"
type VtliStatus =
    | "draft"
    | "approved"
    | "rejected"
    | "rerolled"
    | "published"
// v1.15: 5 sub-tabs activos. RSV Instagram + Reels Higgsfield + TikTok
// quedan apagados (next iteration u otro motor).
type SubTab =
    | "veo_instagram"
    | "vtli_banners"
    | "veo_video"
    | "zakhaar_video"
    | "zakhaar_instagram"
    | "estudio_manual"
    | "zakhaar_posts"
    | "soma_cero"

// Atelier de Video — categorías propias (sin telekinesis por ahora).
type VtliVideoCategory = "veo" | "zakhaar"
type VtliVideoStatus = VtliStatus // espejo de imagenes

interface VtliPost {
    id: string
    category: VtliCategory
    target: string
    aha_moment: string
    prompt_visual: string
    caption: string
    hashtags: string[]
    pulso_nucleo: string | null
    image_r2_url: string | null
    image_mode: string | null // "prompts" = manual (sin API); "api"/null = normal
    is_published: boolean
    status: VtliStatus
    generated_at: string
    generated_by_clerk_id: string
    reroll_count: number
    parent_post_id: string | null
    reviewed_at: string | null
    reviewed_by_clerk_id: string | null
}

interface AtelierDashboard {
    is_admin: boolean
    month_generated_veo: number
    month_generated_telekinesis: number
    month_generated_calibracion: number
    month_generated_sintonia: number
    month_approved: number
    month_rejected: number
    month_rerolled: number
    month_published: number
    total_lifetime: number
}

// v1.7: dashboard espejo para videos. Misma estructura, prefijo distinto.
interface AtelierVideoDashboard {
    is_admin: boolean
    month_generated_veo_video: number
    month_generated_zakhaar_video: number
    month_approved_video: number
    month_published_video: number
    total_lifetime_video: number
}

// v1.7: VtliVideo es el espejo de VtliPost pero con video_r2_url +
// duration_seconds + replicate_prediction_id en lugar de image_r2_url.
interface VtliVideo {
    id: string
    category: VtliVideoCategory
    target: string
    aha_moment: string
    prompt_visual: string
    caption: string
    hashtags: string[]
    pulso_nucleo: string | null
    video_r2_url: string | null
    duration_seconds: number | null
    replicate_prediction_id: string | null
    status: VtliVideoStatus
    generated_at: string
    generated_by_clerk_id: string
    reroll_count: number
    parent_video_id: string | null
    reviewed_at: string | null
    reviewed_by_clerk_id: string | null
}

// v1.15: tipos del universo de Banners (paralelo a VtliPost).
// v1.16: solo 2 formatos Instagram (sin Facebook landscape).
// El feed_square del v1.15 queda retirado — se usa feed_portrait (4:5).
type VtliBannerFormat = "feed_portrait" | "stories_9x16"
type VtliBannerStatus = VtliStatus // espejo de posts
// VtliBanner reusa VtliCategory (los 4 pilares) y suma:
//   · concept_id (UUID agrupador de los 3 formatos del mismo concepto)
//   · banner_format (cuál de los 3 aspect ratios)
//   · hook (3-7 palabras overlay grande, sans-serif gruesa)
//   · subtext (línea geo-local fija, ej. "Cancún · Sesiones presenciales 1:1")
//   · cta_label (texto del botón CTA visible)
//   · cta_url (típicamente "veotuluzinterna.com")
interface VtliBanner {
    id: string
    concept_id: string
    category: VtliCategory
    banner_format: VtliBannerFormat
    target: string
    hook: string
    subtext: string
    cta_label: string
    cta_url: string
    aha_moment: string
    prompt_visual: string
    pulso_nucleo: string | null
    image_r2_url: string | null
    status: VtliBannerStatus
    generated_at: string
    generated_by_clerk_id: string
    reroll_count: number
    parent_banner_id: string | null
    reviewed_at: string | null
    reviewed_by_clerk_id: string | null
}

interface AtelierBannersDashboard {
    is_admin: boolean
    month_generated_veo: number
    month_generated_telekinesis: number
    month_generated_calibracion: number
    month_generated_sintonia: number
    // v1.16: feed_portrait (4:5) reemplazó a feed_square (1:1).
    // El RPC devuelve "month_generated_feed_portrait" desde v1.1
    // de la migración 20260527d.
    month_generated_feed_portrait: number
    month_generated_stories: number
    month_approved: number
    month_published: number
    total_lifetime: number
}

interface PanelProps {
    supabaseUrl?: string
    supabaseAnonKey?: string
}

/* ═══════════════════════════════════════════════════════════════
   3. CSS GLOBAL DEL ATELIER
   ═══════════════════════════════════════════════════════════════ */

const CSS = `
.at-wrap{font-family:'Inter',sans-serif;color:#fff;position:fixed;inset:0;z-index:40;padding:110px 28px 120px;overflow-y:auto;overflow-x:hidden;background:radial-gradient(125% 85% at 50% -12%, #46355e 0%, #34264a 30%, #271d39 58%, #1d1830 100%);scrollbar-width:none;-ms-overflow-style:none}
.at-wrap::-webkit-scrollbar{display:none}
.at-wrap *{box-sizing:border-box;scrollbar-width:none;-ms-overflow-style:none}
.at-wrap *::-webkit-scrollbar{display:none}

/* ── Fondo "Amanecer Solar": auroras cálidas que derivan lento (reemplaza el campo de estrellas) ── */
.at-cosmos-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.at-aurora{position:absolute;border-radius:50%;filter:blur(120px);mix-blend-mode:screen;will-change:transform;opacity:0.85}
.at-aurora.a1{width:60vw;height:60vw;left:-12vw;top:-10vh;background:radial-gradient(circle, ${hx(GOLD, 0.55)} 0%, ${hx(GOLD, 0)} 70%);animation:atAur1 32s ease-in-out infinite}
.at-aurora.a2{width:55vw;height:55vw;right:-14vw;bottom:-12vh;background:radial-gradient(circle, rgba(230,135,100,0.5) 0%, rgba(230,135,100,0) 70%);animation:atAur2 38s ease-in-out infinite}
.at-aurora.a3{width:46vw;height:46vw;right:8vw;top:-6vh;background:radial-gradient(circle, rgba(45,185,200,0.38) 0%, rgba(45,185,200,0) 70%);animation:atAur3 28s ease-in-out infinite}
.at-aurora.a4{width:50vw;height:50vw;left:-8vw;bottom:-10vh;background:radial-gradient(circle, rgba(155,134,214,0.42) 0%, rgba(155,134,214,0) 70%);animation:atAur4 44s ease-in-out infinite}
.at-aurora.a5{width:38vw;height:38vw;left:38vw;top:30vh;background:radial-gradient(circle, ${hx(GOLD, 0.3)} 0%, ${hx(GOLD, 0)} 70%);animation:atAur3 50s ease-in-out infinite}
@keyframes atAur1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(6vw,5vh) scale(1.12)}}
@keyframes atAur2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-5vw,-4vh) scale(1.1)}}
@keyframes atAur3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-4vw,6vh) scale(1.15)}}
@keyframes atAur4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(5vw,-5vh) scale(1.08)}}
@media (prefers-reduced-motion: reduce){.at-aurora{animation:none !important}}
.at-title{position:fixed;top:14px;left:0;right:0;z-index:55;font-size:15px;font-weight:200;letter-spacing:0.35em;text-transform:uppercase;text-align:center;margin:0;color:${GOLD};text-shadow:0 0 12px ${hx(GOLD, 0.3)};pointer-events:none}
.at-title-sub{position:fixed;top:36px;left:0;right:0;z-index:55;font-size:8px;font-weight:400;letter-spacing:0.2em;text-transform:uppercase;text-align:center;color:#fff;margin:0;pointer-events:none;opacity:0.8}
.at-shell{max-width:1280px;margin:0 auto;position:relative;z-index:1}

.at-dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:36px}
.at-stat{padding:18px 16px;border-radius:14px;border:1px solid ${hx(GOLD, 0.22)};background:linear-gradient(135deg,${hx(GOLD, 0.07)},rgba(255,248,236,0.025));text-align:center;backdrop-filter:blur(16px) saturate(1.1);-webkit-backdrop-filter:blur(16px) saturate(1.1);box-shadow:0 8px 26px rgba(20,12,30,0.28)}
.at-stat-num{font-size:28px;font-weight:200;color:${GOLD};letter-spacing:-0.02em;margin:0 0 4px;text-shadow:0 0 10px ${hx(GOLD, 0.4)}}
.at-stat-lbl{font-size:9px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.62);margin:0}

.at-subtabs{display:flex;gap:8px;justify-content:center;margin:0 auto 32px;flex-wrap:wrap}
.at-subtab{padding:10px 26px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:#fff;font-family:inherit;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;outline:none}
.at-subtab:hover{border-color:${hx(GOLD, 0.4)};color:${GOLD}}
.at-subtab.active{border-color:${hx(GOLD, 0.6)};background:${hx(GOLD, 0.08)};color:${GOLD};box-shadow:inset 0 0 12px ${hx(GOLD, 0.12)}}
.at-subtab.disabled{opacity:0.35;cursor:not-allowed;border-color:rgba(255,255,255,0.1)}
.at-subtab.disabled:hover{border-color:rgba(255,255,255,0.1);color:#fff}

.at-gen-buttons{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:36px}
.at-gen-btn{padding:24px 28px;border-radius:16px;border:1px solid ${hx(GOLD, 0.4)};background:linear-gradient(135deg,${hx(GOLD, 0.10)},${hx(GOLD, 0.04)});color:#fff;font-family:inherit;font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;outline:none;text-align:left;display:flex;align-items:center;gap:14px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);position:relative;overflow:hidden}
.at-gen-btn:hover:not(:disabled){border-color:${hx(GOLD, 0.7)};background:linear-gradient(135deg,${hx(GOLD, 0.16)},${hx(GOLD, 0.06)});box-shadow:0 0 24px ${hx(GOLD, 0.2)}}
.at-gen-btn:disabled{opacity:0.6;cursor:wait}
.at-gen-btn.busy{cursor:wait;border-color:${hx(GOLD, 0.6)}}
.at-gen-btn.busy::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,${hx(GOLD, 0.18)},transparent);background-size:200% 100%;animation:atShimmer 1.6s linear infinite;pointer-events:none}
@keyframes atShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.at-gen-glyph{width:42px;height:42px;flex-shrink:0;border-radius:50%;border:1.5px solid ${hx(GOLD, 0.5)};display:flex;align-items:center;justify-content:center;color:${GOLD};font-size:18px;font-weight:200}
.at-gen-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.at-gen-main{font-size:13px;font-weight:600;letter-spacing:0.16em;color:#fff}
.at-gen-sub{font-size:9px;font-weight:400;letter-spacing:0.14em;color:rgba(255,255,255,0.55);text-transform:none;letter-spacing:0.02em}

.at-batch-header{margin:0 0 18px;padding:14px 18px;border-radius:12px;border:1px solid ${hx(CYAN, 0.25)};background:${hx(CYAN, 0.04)};display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.at-batch-title{font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${CYAN};margin:0}
.at-batch-meta{font-size:10px;font-weight:400;color:rgba(255,255,255,0.6);letter-spacing:0.04em}

.at-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;margin-bottom:48px}
.at-card{border-radius:18px;border:1px solid rgba(255,244,224,0.16);background:linear-gradient(180deg,rgba(255,248,236,0.08),rgba(255,248,236,0.02));overflow:hidden;display:flex;flex-direction:column;backdrop-filter:blur(20px) saturate(1.12);-webkit-backdrop-filter:blur(20px) saturate(1.12);box-shadow:0 10px 34px rgba(20,12,30,0.32);transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s}
.at-card:hover{border-color:${hx(GOLD, 0.35)};box-shadow:0 12px 36px rgba(0,0,0,0.45)}
.at-card.status-approved{border-color:${hx(GOLD, 0.5)};box-shadow:0 0 24px ${hx(GOLD, 0.18)} inset}
.at-card.status-rejected{opacity:0.55;border-color:rgba(255,100,100,0.25)}
.at-card.status-rerolled{opacity:0.65;border-color:rgba(180,180,180,0.18)}
.at-card.status-published{border-color:rgba(140,255,200,0.4);box-shadow:0 0 24px rgba(140,255,200,0.18) inset}

.at-card-image{position:relative;width:100%;aspect-ratio:3/4;background:#0a0a14;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:zoom-in}
.at-card-image.is-video{aspect-ratio:9/16}
.at-card-image img,.at-card-image video{width:100%;height:100%;object-fit:cover;display:block}
.at-card-image-placeholder{font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.16em;padding:0 16px;text-align:center;line-height:1.6}
.at-card-image-pending{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:${hx(GOLD, 0.85)};font-size:10px;letter-spacing:0.24em;text-transform:uppercase;font-weight:500;padding:24px}
.at-card-image-spinner{width:38px;height:38px;border-radius:50%;border:2px solid ${hx(GOLD, 0.2)};border-top-color:${GOLD};animation:atSpin 1.1s linear infinite}
.at-card-image-retry{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px}
.at-card-image-retry-label{font-size:10px;color:rgba(255,180,180,0.78);letter-spacing:0.18em;text-transform:uppercase;font-weight:500;text-align:center;line-height:1.5}
.at-card-image-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:24px;cursor:pointer;text-align:center;color:rgba(255,255,255,0.62);font-size:10px;letter-spacing:0.05em;line-height:1.4}
.at-card-image-upload:hover{color:${GOLD}}
.at-card-upload-icon{font-size:26px;color:${hx(GOLD, 0.85)}}
.at-card-upload-hint{font-size:9px;color:rgba(255,255,255,0.4)}
.at-card-promptbox{background:rgba(0,0,0,0.25);border:1px solid ${hx(CYAN, 0.22)};border-radius:10px;padding:9px 10px;margin-bottom:10px}
.at-card-promptbox-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.at-card-promptbox-head span{font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:${hx(CYAN, 0.8)};font-weight:600}
.at-card-promptbox-copy{border:1px solid ${hx(CYAN, 0.35)};background:transparent;color:${CYAN};font-size:9px;padding:3px 8px;border-radius:6px;cursor:pointer;font-family:inherit;flex-shrink:0}
.at-card-promptbox-copy:hover{background:${hx(CYAN, 0.1)}}
.at-card-prompt{font-size:10px;color:rgba(255,255,255,0.7);line-height:1.45;white-space:pre-wrap;margin:0;max-height:130px;overflow-y:auto;padding-right:4px}
.at-action.publish{border-color:rgba(255,255,255,0.18);color:rgba(255,255,255,0.6)}
.at-action.publish:hover:not(:disabled){border-color:rgba(120,230,160,0.5);color:rgba(180,240,200,0.92)}
.at-action.publish.on{border-color:rgba(80,220,130,0.6);color:#7fe6a0;background:rgba(80,220,130,0.14)}
.at-mode-toggle{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.at-mode-label{font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.5)}
.at-mode-btn{padding:7px 16px;border-radius:9px;border:1px solid ${hx(GOLD, 0.3)};background:transparent;color:rgba(255,255,255,0.7);font-family:inherit;font-size:11px;font-weight:600;letter-spacing:0.04em;cursor:pointer;transition:all 0.2s}
.at-mode-btn:disabled{opacity:0.5;cursor:wait}
.at-mode-btn.on{background:${hx(GOLD, 0.16)};border-color:${hx(GOLD, 0.6)};color:#fff}
.at-mode-hint{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.4;flex-basis:100%}
.at-card-image-retry-btn{padding:10px 18px;border-radius:8px;border:1px solid ${hx(GOLD, 0.55)};background:${hx(GOLD, 0.1)};color:${GOLD};font-family:inherit;font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.at-card-image-retry-btn:hover:not(:disabled){background:${hx(GOLD, 0.2)};border-color:${hx(GOLD, 0.8)};box-shadow:0 0 16px ${hx(GOLD, 0.3)}}
.at-card-image-retry-btn:disabled{opacity:0.45;cursor:wait}
.at-card-image-retry-secondary{padding:7px 12px;font-size:9px;border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55)}
.at-card-image-retry-secondary:hover:not(:disabled){background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.32);box-shadow:none;color:rgba(255,255,255,0.85)}
.at-card-image-rescue-btn{padding:13px 22px;border-radius:10px;border:1px solid ${hx(GOLD, 0.85)};background:linear-gradient(135deg, ${hx(GOLD, 0.28)}, ${hx(GOLD, 0.14)});color:${GOLD};font-family:inherit;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;transition:all 0.3s;outline:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 0 18px ${hx(GOLD, 0.32)},inset 0 0 12px ${hx(GOLD, 0.12)};animation:rescue-pulse 2.4s ease-in-out infinite}
.at-card-image-rescue-btn:hover:not(:disabled){background:linear-gradient(135deg, ${hx(GOLD, 0.42)}, ${hx(GOLD, 0.22)});box-shadow:0 0 28px ${hx(GOLD, 0.55)},inset 0 0 18px ${hx(GOLD, 0.2)}}
.at-card-image-rescue-btn:disabled{opacity:0.5;cursor:wait;animation:none}
@keyframes rescue-pulse{0%,100%{box-shadow:0 0 18px ${hx(GOLD, 0.32)},inset 0 0 12px ${hx(GOLD, 0.12)}}50%{box-shadow:0 0 26px ${hx(GOLD, 0.5)},inset 0 0 18px ${hx(GOLD, 0.22)}}}
.at-card-image-delete-btn{padding:7px 12px;border-radius:8px;border:1px solid rgba(255,80,80,0.32);background:rgba(255,80,80,0.06);color:rgba(255,180,180,0.78);font-family:inherit;font-size:9px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none;margin-top:6px}
.at-card-image-delete-btn:hover:not(:disabled){background:rgba(255,80,80,0.16);border-color:rgba(255,80,80,0.55);color:rgba(255,210,210,0.95)}
.at-card-image-delete-btn:disabled{opacity:0.45;cursor:wait}
@keyframes atSpin{to{transform:rotate(360deg)}}
.at-card.pending{border-color:${hx(GOLD, 0.32)};animation:atPendingPulse 2.6s ease-in-out infinite}
@keyframes atPendingPulse{0%,100%{box-shadow:0 0 0 ${hx(GOLD, 0)}}50%{box-shadow:0 0 28px ${hx(GOLD, 0.15)}}}
.at-card.failed{border-color:rgba(255,120,120,0.4);opacity:0.7}
.at-card-cat-pill{position:absolute;top:10px;left:10px;padding:5px 10px;border-radius:6px;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.at-card-cat-pill.veo{color:${VEO_TINT};border:1px solid ${hx(VEO_TINT, 0.5)}}
.at-card-cat-pill.tele{color:${TELE_TINT};border:1px solid ${hx(TELE_TINT, 0.5)}}
.at-card-cat-pill.cali{color:${CALIBRACION_TINT};border:1px solid ${hx(CALIBRACION_TINT, 0.5)}}
.at-card-cat-pill.sint{color:${SINTONIA_TINT};border:1px solid ${hx(SINTONIA_TINT, 0.5)}}
/* v1.15: pill de formato para banners — posición center-top para no chocar con la pill de categoría (top-left) ni con status (top-right). */
.at-card-format-pill{position:absolute;top:10px;left:50%;transform:translateX(-50%);padding:5px 10px;border-radius:6px;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.at-card-format-pill.feed{color:${FEED_TINT};border:1px solid ${hx(FEED_TINT, 0.5)}}
.at-card-format-pill.stories{color:${STORIES_TINT};border:1px solid ${hx(STORIES_TINT, 0.5)}}
/* v1.16: aspect ratios específicos para los 2 formatos canónicos de Instagram. Sobrescribe el default 3:4 del at-card-image. */
.at-card-image.banner-feed_portrait{aspect-ratio:4/5}
.at-card-image.banner-stories_9x16{aspect-ratio:9/16}
/* v1.16: border-left de 3px con el color del formato para diferenciar visualmente los 2 banners del mismo concepto en la grilla. */
.at-card.banner-feed_portrait{border-left:3px solid ${hx(FEED_TINT, 0.55)}}
.at-card.banner-stories_9x16{border-left:3px solid ${hx(STORIES_TINT, 0.55)}}
/* v1.15: heading del concepto (sobre el grupo de 3 banners) en el feed activo. */
.at-banner-concept-header{margin:18px 0 12px;padding:14px 18px;border-radius:12px;border:1px solid ${hx(GOLD, 0.25)};background:linear-gradient(135deg, ${hx(GOLD, 0.05)}, rgba(255,255,255,0.01));backdrop-filter:blur(8px)}
.at-banner-concept-hook{font-size:18px;font-weight:600;color:${GOLD};margin:0 0 6px;letter-spacing:-0.01em;text-shadow:0 0 10px ${hx(GOLD, 0.3)}}
.at-banner-concept-target{font-size:10px;font-weight:500;color:rgba(255,255,255,0.65);margin:0 0 6px;letter-spacing:0.12em;text-transform:uppercase}
.at-banner-concept-pulso{font-size:11px;font-weight:400;color:rgba(255,255,255,0.78);margin:0;font-style:italic;line-height:1.45}
.at-banner-concept-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.at-banner-concept-action{padding:7px 14px;border-radius:7px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:#fff;font-family:inherit;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none}
.at-banner-concept-action:hover:not(:disabled){border-color:${hx(CYAN, 0.6)};color:${CYAN};background:${hx(CYAN, 0.06)}}
.at-banner-concept-action:disabled{opacity:0.45;cursor:not-allowed}
.at-card-status-pill{position:absolute;top:10px;right:10px;padding:5px 10px;border-radius:6px;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.at-card-status-pill.draft{color:rgba(255,255,255,0.62);border:1px solid rgba(255,255,255,0.2)}
.at-card-status-pill.approved{color:${GOLD};border:1px solid ${hx(GOLD, 0.5)}}
.at-card-status-pill.rejected{color:rgba(255,140,140,0.85);border:1px solid rgba(255,140,140,0.4)}
.at-card-status-pill.rerolled{color:rgba(200,200,200,0.7);border:1px solid rgba(200,200,200,0.3)}
.at-card-status-pill.published{color:rgba(140,255,200,0.9);border:1px solid rgba(140,255,200,0.5)}

.at-card-body{padding:16px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.at-card-target{font-size:9px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin:0}
.at-card-aha{font-size:13px;font-weight:500;color:#fff;line-height:1.4;margin:0;font-style:italic}
.at-card-caption{font-size:11px;font-weight:400;color:rgba(255,255,255,0.78);line-height:1.5;white-space:pre-wrap;margin:0;max-height:200px;overflow-y:auto;padding-right:4px}
.at-card-hashtags{font-size:10px;color:${hx(CYAN, 0.75)};font-weight:400;line-height:1.5;letter-spacing:0.02em;margin:0}
.at-card-pulso{font-size:10px;color:rgba(255,255,255,0.45);font-style:italic;border-left:2px solid ${hx(GOLD, 0.35)};padding:4px 0 4px 10px;margin:6px 0 0}

.at-card-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:12px 14px;border-top:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.18)}
.at-action{padding:9px 6px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:#fff;font-family:inherit;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none;display:flex;align-items:center;justify-content:center;gap:4px}
.at-action:hover:not(:disabled){background:rgba(255,255,255,0.08)}
.at-action:disabled{opacity:0.35;cursor:not-allowed}
.at-action.approve:hover:not(:disabled){border-color:${hx(GOLD, 0.6)};color:${GOLD};background:${hx(GOLD, 0.08)}}
.at-action.reroll:hover:not(:disabled){border-color:${hx(CYAN, 0.6)};color:${CYAN};background:${hx(CYAN, 0.08)}}
.at-action.download:hover:not(:disabled){border-color:rgba(255,255,255,0.4);color:#fff}
.at-action.copy:hover:not(:disabled){border-color:rgba(255,255,255,0.4);color:#fff}
.at-action.delete:hover:not(:disabled){border-color:rgba(255,120,120,0.55);color:rgba(255,170,170,0.95);background:rgba(255,80,80,0.08)}

.at-section-header{font-size:11px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:${GOLD};margin:48px 0 18px;padding-bottom:10px;border-bottom:1px solid ${hx(GOLD, 0.2)};display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.at-section-header-count{font-size:10px;color:rgba(255,255,255,0.5);font-weight:400;letter-spacing:0.04em}

.at-history-filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.at-filter{padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:rgba(255,255,255,0.75);font-family:inherit;font-size:10px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;transition:all 0.25s;outline:none}
.at-filter:hover{border-color:${hx(GOLD, 0.4)};color:${GOLD}}
.at-filter.active{border-color:${hx(GOLD, 0.6)};background:${hx(GOLD, 0.08)};color:${GOLD}}

.at-history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.at-history-thumb{position:relative;aspect-ratio:3/4;border-radius:10px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;cursor:pointer;background:#0a0a14;transition:transform 0.25s,border-color 0.25s}
.at-history-thumb:hover{transform:scale(1.04);border-color:${hx(GOLD, 0.4)}}
.at-history-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.at-history-thumb .at-thumb-status{position:absolute;bottom:6px;right:6px;padding:3px 7px;border-radius:4px;font-size:7px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px)}

.at-empty{padding:36px 20px;text-align:center;color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:0.08em;border-radius:12px;border:1px dashed rgba(255,255,255,0.12);font-style:italic}

.at-error{padding:14px 18px;border-radius:10px;border:1px solid rgba(255,120,120,0.4);background:rgba(255,80,80,0.08);color:rgba(255,180,180,0.92);font-size:11px;line-height:1.5;margin-bottom:18px;letter-spacing:0.02em}
.at-soon{max-width:520px;margin:60px auto;padding:40px 32px;text-align:center;border-radius:18px;border:1px solid rgba(212,168,67,0.3);background:linear-gradient(135deg,rgba(212,168,67,0.06),rgba(255,255,255,0.02))}
.at-soon-glyph{font-size:42px;margin-bottom:14px}
.at-soon-title{font-size:15px;font-weight:600;letter-spacing:0.1em;color:#E6C470;margin:0 0 12px}
.at-soon-text{font-size:12px;line-height:1.6;color:rgba(255,255,255,0.6);margin:0}

.at-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:10px;background:${hx(GOLD, 0.95)};color:#1a1208;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;z-index:9999;box-shadow:0 8px 28px rgba(0,0,0,0.45);backdrop-filter:blur(10px)}

.at-lightbox{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:32px;cursor:zoom-out;backdrop-filter:blur(8px)}
.at-lightbox img,.at-lightbox video{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 12px 60px rgba(0,0,0,0.7)}
.at-lightbox-close{position:absolute;top:24px;right:24px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.6);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:200}

/* MOBILE */
@media (max-width:768px){
    .at-wrap{padding:96px 16px 100px}
    .at-title{font-size:13px;letter-spacing:0.28em}
    .at-title-sub{font-size:7px}
    .at-dashboard{grid-template-columns:repeat(2,1fr);gap:8px}
    .at-stat{padding:14px 10px}
    .at-stat-num{font-size:22px}
    .at-stat-lbl{font-size:8px}
    .at-gen-buttons{grid-template-columns:1fr;gap:10px}
    .at-gen-btn{padding:18px 20px}
    .at-grid{grid-template-columns:1fr;gap:16px}
    .at-card-actions{grid-template-columns:repeat(3,minmax(0,1fr))}
    .at-history-grid{grid-template-columns:repeat(3,1fr);gap:6px}
}

/* ════════ TEMA CLARO "VTLI" (estilo veotuluzinterna.com) — overrides ════════ */
.at-wrap{color:#2E333C;background:linear-gradient(165deg,#F6F2EA 0%,#EAF0F4 54%,#F1EEE7 100%)}
.at-aurora{mix-blend-mode:normal;opacity:0.55;filter:blur(130px)}
.at-aurora.a1{background:radial-gradient(circle, rgba(214,168,67,0.22) 0%, rgba(214,168,67,0) 70%)}
.at-aurora.a2{background:radial-gradient(circle, rgba(224,158,138,0.16) 0%, rgba(224,158,138,0) 70%)}
.at-aurora.a3{background:radial-gradient(circle, rgba(150,186,216,0.30) 0%, rgba(150,186,216,0) 70%)}
.at-aurora.a4{background:radial-gradient(circle, rgba(176,186,222,0.24) 0%, rgba(176,186,222,0) 70%)}
.at-aurora.a5{background:radial-gradient(circle, rgba(214,168,67,0.16) 0%, rgba(214,168,67,0) 70%)}
.at-title{color:#A9781F;font-weight:300;text-shadow:none}
.at-title-sub{color:#5E6772;opacity:1}
.at-stat{background:#FFFFFF;border:1px solid rgba(60,82,115,0.12);box-shadow:0 8px 26px rgba(60,82,115,0.10);backdrop-filter:none;-webkit-backdrop-filter:none}
.at-stat-num{color:#A9781F;text-shadow:none}
.at-stat-lbl{color:#6B7480}
.at-subtab{background:#FFFFFF;color:#4A515B;border:1px solid rgba(60,82,115,0.14)}
.at-subtab:hover{border-color:${hx(GOLD, 0.6)};color:#A9781F}
.at-subtab.active{background:${hx(GOLD, 0.14)};border-color:${hx(GOLD, 0.7)};color:#8A6418;box-shadow:none}
.at-subtab.disabled,.at-subtab.disabled:hover{border-color:rgba(60,82,115,0.1);color:#AEB5BD}
.at-gen-btn{color:#3A2E12;border:1px solid rgba(168,116,24,0.5);background:linear-gradient(135deg,#E6C470 0%,#D4A843 100%);box-shadow:0 8px 22px rgba(176,128,40,0.28);backdrop-filter:none;-webkit-backdrop-filter:none}
.at-gen-btn:hover:not(:disabled){border-color:rgba(168,116,24,0.7);background:linear-gradient(135deg,#EBCD80 0%,#D9AE49 100%);box-shadow:0 10px 28px rgba(176,128,40,0.4)}
.at-gen-glyph{border-color:rgba(58,46,18,0.4);color:#3A2E12}
.at-gen-main{color:#3A2E12}
.at-gen-sub{color:rgba(58,46,18,0.72)}
.at-batch-header{border:1px solid rgba(94,137,176,0.35);background:rgba(94,137,176,0.10)}
.at-batch-title{color:#3F6E96}
.at-batch-meta{color:#5E6772}
.at-card{background:#FFFFFF;border:1px solid rgba(60,82,115,0.12);box-shadow:0 8px 30px rgba(60,82,115,0.10);backdrop-filter:none;-webkit-backdrop-filter:none}
.at-card:hover{border-color:${hx(GOLD, 0.55)};box-shadow:0 14px 36px rgba(60,82,115,0.16)}
.at-card.status-published{border-color:rgba(70,190,140,0.55);box-shadow:inset 0 0 0 1px rgba(70,190,140,0.25)}
.at-card-image{background:#EAEEF2}
.at-card-image-placeholder{color:#9AA2AC}
.at-card-image-upload{color:#5E6772}
.at-card-upload-hint{color:#9AA2AC}
.at-card-promptbox{background:#F0F4F7;border:1px solid rgba(94,137,176,0.3)}
.at-card-promptbox-head span{color:#3F6E96}
.at-card-promptbox-copy{border-color:rgba(94,137,176,0.5);color:#3F6E96}
.at-card-promptbox-copy:hover{background:rgba(94,137,176,0.12)}
.at-card-prompt{color:#545C66}
.at-card-actions{border-top:1px solid rgba(60,82,115,0.1);background:#FAFBFC}
.at-action{color:#4A515B;border:1px solid rgba(60,82,115,0.16)}
.at-action:hover:not(:disabled){background:rgba(60,82,115,0.06)}
.at-action.approve:hover:not(:disabled){border-color:${hx(GOLD, 0.7)};color:#8A6418;background:${hx(GOLD, 0.1)}}
.at-action.reroll:hover:not(:disabled){border-color:rgba(94,137,176,0.7);color:#3F6E96;background:rgba(94,137,176,0.1)}
.at-action.download:hover:not(:disabled),.at-action.copy:hover:not(:disabled){border-color:rgba(60,82,115,0.4);color:#2E333C}
.at-action.publish{border-color:rgba(60,82,115,0.16);color:#6B7480}
.at-mode-label{color:#6B7480}
.at-mode-btn{color:#545C66;border:1px solid rgba(168,116,24,0.4);background:#FFFFFF}
.at-mode-btn.on{background:${hx(GOLD, 0.16)};border-color:${hx(GOLD, 0.7)};color:#8A6418}
.at-mode-hint{color:#6B7480}
.at-card-target{color:#97A0AA}
.at-card-aha{color:#2E333C}
.at-card-caption{color:#4A515B}
.at-card-hashtags{color:#3F6E96}
.at-card-pulso{color:#7A828C;border-left-color:${hx(GOLD, 0.5)}}
.at-section-header{color:#A9781F;border-bottom:1px solid rgba(168,116,24,0.3)}
.at-section-header-count{color:#6B7480}
.at-filter{background:#FFFFFF;color:#545C66;border:1px solid rgba(60,82,115,0.14)}
.at-filter:hover{border-color:${hx(GOLD, 0.6)};color:#A9781F}
.at-filter.active{background:${hx(GOLD, 0.14)};border-color:${hx(GOLD, 0.7)};color:#8A6418}
.at-history-thumb{background:#EAEEF2;border:1px solid rgba(60,82,115,0.12)}
.at-empty{color:#8A929C;border:1px dashed rgba(60,82,115,0.18)}
.at-error{background:rgba(214,69,69,0.08);border:1px solid rgba(214,69,69,0.35);color:#B23A3A}
.at-soon{border-color:rgba(168,116,24,0.3);background:#FFFFFF;box-shadow:0 8px 26px rgba(60,82,115,0.10)}
.at-soon-title{color:#A9781F}
.at-soon-text{color:#545C66}
.at-banner-concept-header{border:1px solid rgba(168,116,24,0.28);background:#FFFFFF;backdrop-filter:none}
.at-banner-concept-hook{color:#A9781F;text-shadow:none}
.at-banner-concept-target{color:#6B7480}
.at-banner-concept-pulso{color:#545C66}
.at-banner-concept-action{color:#4A515B;border:1px solid rgba(60,82,115,0.18)}
`

/* ═══════════════════════════════════════════════════════════════
   4. SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

interface PostCardProps {
    post: VtliPost
    isProcessing: boolean
    // v1.6: contador de auto-retries disparados por el polling para este card.
    // Permite mostrar "Reintentando N de 5..." en lugar del genérico
    // "Materializando" cuando hay actividad de reintento en curso.
    autoRetryCount: number
    autoRetriesExhausted: boolean
    onApprove: () => void
    onPublish: () => void
    onReject: () => void
    onReroll: () => void
    onDownload: () => void
    onCopy: () => void
    onDelete: () => void
    onRetryImage: () => void
    onZoom: (url: string) => void
    // Modo manual ("solo prompts"): subir la imagen final + copiar el prompt +
    // marcar publicado.
    onUploadImage: (file: File) => void
    onCopyPrompt: () => void
    onTogglePublished: () => void
    uploading: boolean
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
            img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
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
                    reject(new Error("No se pudo crear el lienzo"))
                    return
                }
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
                resolve({
                    base64: dataUrl.split(",")[1] || "",
                    mime: "image/jpeg",
                })
            }
            img.src = String(reader.result)
        }
        reader.readAsDataURL(file)
    })
}

function PostCard({
    post,
    isProcessing,
    autoRetryCount,
    autoRetriesExhausted,
    onApprove,
    onPublish,
    onReject,
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
    // Modo manual: el motor solo dio el prompt; Zak genera la imagen a mano.
    const isManual = post.image_mode === "prompts"
    const fileInputRef = useRef<HTMLInputElement>(null)
    // Input persistente para "Resubir" la imagen manual (reemplaza la ya subida).
    const reuploadRef = useRef<HTMLInputElement>(null)
    const catLabel = (() => {
        switch (post.category) {
            case "veo":
                return "VEO"
            case "telekinesis":
                return "Telekinesis"
            case "calibracion":
                return "Calibración"
            case "sintonia":
                return "Sintonía"
        }
    })()
    const catClass = (() => {
        switch (post.category) {
            case "veo":
                return "veo"
            case "telekinesis":
                return "tele"
            case "calibracion":
                return "cali"
            case "sintonia":
                return "sint"
        }
    })()
    const isPendingImage =
        !post.image_r2_url && post.status !== "rejected" && !isManual
    const isFailedImage =
        !post.image_r2_url && post.status === "rejected" && !isManual
    const secondsSinceGenerated =
        (Date.now() - new Date(post.generated_at).getTime()) / 1000
    // v1.6: el card se marca "atascado" (botón manual visible) cuando:
    //  (a) el polling agotó los 5 auto-retries, O
    //  (b) pasó MAX_AUTO_RETRIES × THRESHOLD + 30s sin completar
    //      (cobertura si el polling no llegó a registrar todos los retries).
    // Antes el threshold único de 3 min era inalcanzable porque cada
    // auto-retry reseteaba generated_at, dejando al card eternamente "pending".
    const isStuckPending =
        isPendingImage &&
        (autoRetriesExhausted ||
            secondsSinceGenerated >
                AUTO_RETRY_THRESHOLD_SEC * MAX_AUTO_RETRIES + 30)
    const cardClass = `at-card status-${post.status}${isPendingImage && !isStuckPending ? " pending" : ""}${isFailedImage || isStuckPending ? " failed" : ""}`
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
                className="at-card-image"
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
                    <img src={post.image_r2_url} alt={post.target} loading="lazy" />
                ) : isManual ? (
                    <div
                        className="at-card-image-upload"
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
                                <div className="at-card-image-spinner" />
                                <span>Subiendo…</span>
                            </>
                        ) : (
                            <>
                                <span className="at-card-upload-icon">⬆</span>
                                <span>Sube tu imagen de Nano Banana</span>
                                <span className="at-card-upload-hint">
                                    (registro de la pieza final)
                                </span>
                            </>
                        )}
                    </div>
                ) : isFailedImage ? (
                    <div className="at-card-image-retry">
                        <div className="at-card-image-retry-label">
                            Imagen falló
                        </div>
                        <button
                            className="at-card-image-retry-btn"
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
                ) : isStuckPending ? (
                    <div className="at-card-image-retry">
                        <div className="at-card-image-retry-label">
                            Tiempo agotado
                        </div>
                        <button
                            className="at-card-image-retry-btn"
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
                    <div className="at-card-image-pending">
                        <div className="at-card-image-spinner" />
                        <span>
                            {autoRetryCount > 0
                                ? `Reintentando ${autoRetryCount} de ${MAX_AUTO_RETRIES}`
                                : "Materializando"}
                        </span>
                    </div>
                )}
                <div className={`at-card-cat-pill ${catClass}`}>{catLabel}</div>
                <div className={`at-card-status-pill ${post.status}`}>
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

            <div className="at-card-body">
                <p className="at-card-target">{post.target.replace(/_/g, " ")}</p>
                {/* Modo manual: el prompt para pegar a mano en Nano Banana.
                    Al subir la imagen final, el prompt se oculta y se ve la pieza. */}
                {isManual && !post.image_r2_url && (
                    <div className="at-card-promptbox">
                        <div className="at-card-promptbox-head">
                            <span>Prompt para Nano Banana</span>
                            <button
                                className="at-card-promptbox-copy"
                                onClick={onCopyPrompt}
                            >
                                📋 Copiar prompt
                            </button>
                        </div>
                        <pre className="at-card-prompt">{post.prompt_visual}</pre>
                    </div>
                )}
                {post.aha_moment && (
                    <p className="at-card-aha">"{post.aha_moment}"</p>
                )}
                <pre className="at-card-caption">{post.caption}</pre>
                {post.hashtags.length > 0 && (
                    <p className="at-card-hashtags">
                        {post.hashtags.map((h) => `#${h}`).join(" ")}
                    </p>
                )}
                {post.pulso_nucleo && (
                    <p className="at-card-pulso">
                        Pulso: {post.pulso_nucleo}
                    </p>
                )}
            </div>

            <div className="at-card-actions">
                {isManual ? (
                    /* Manual: ya elegiste la buena → sin reroll ni aprobar.
                       Publicado, descargar (si hay imagen), copiar texto, borrar. */
                    <>
                        <button
                            className={`at-action publish${post.is_published ? " on" : ""}`}
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
                            className="at-action reroll"
                            onClick={() => {
                                if (!uploading) reuploadRef.current?.click()
                            }}
                            disabled={uploading}
                            title="Subir otra imagen en lugar de la actual (reemplaza la que subiste)"
                        >
                            {uploading ? "…" : "⤵ Resubir"}
                        </button>
                        <button
                            className="at-action download"
                            onClick={onDownload}
                            disabled={!post.image_r2_url}
                            title="Descargar la imagen que subiste"
                        >
                            ↓ Imagen
                        </button>
                        <button
                            className="at-action copy"
                            onClick={onCopy}
                            title="Copiar caption + hashtags al portapapeles"
                        >
                            📋 Texto
                        </button>
                        <button
                            className="at-action delete"
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
                                className="at-action approve"
                                onClick={onPublish}
                                disabled={isProcessing}
                                title="Marcar como publicado en Instagram (lo saca del feed activo)"
                            >
                                ↗ Publicar
                            </button>
                        ) : (
                            <button
                                className="at-action approve"
                                onClick={onApprove}
                                disabled={
                                    isProcessing || isFinal || !post.image_r2_url
                                }
                                title="Aprobar para alimentar memoria anti-repetición"
                            >
                                ✓ Aprobar
                            </button>
                        )}
                        <button
                            className="at-action reroll"
                            onClick={onReroll}
                            disabled={
                                isProcessing || isFinal || !post.image_r2_url
                            }
                            title="Generar variante nueva apuntando a este como padre"
                        >
                            ↻ Reroll
                        </button>
                        <button
                            className="at-action download"
                            onClick={onDownload}
                            disabled={!post.image_r2_url}
                            title="Descargar imagen 1080×1440"
                        >
                            ↓ Imagen
                        </button>
                        <button
                            className="at-action copy"
                            onClick={onCopy}
                            title="Copiar caption + hashtags al portapapeles"
                        >
                            📋 Texto
                        </button>
                        <button
                            className="at-action delete"
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

/* ───────────────────────────────────────────────────────────────
   BannerCard — espejo de PostCard pero con anatomía ad-ready.
   El cuerpo NO muestra caption/aha/hashtags (esos viven en el
   heading del concepto). El cuerpo muestra hook + subtext + CTA +
   URL como SPECS del banner (lo que el visitor va a ver al
   exportar a Meta Ads). Aspect ratio variable según banner_format.
   Reroll regenera el CONCEPTO completo (los 3 banners se marcan
   rerolled y se generan 3 nuevos con nuevo concept_id).
   ─────────────────────────────────────────────────────────────── */

interface BannerCardProps {
    banner: VtliBanner
    isProcessing: boolean
    autoRetryCount: number
    autoRetriesExhausted: boolean
    onApprove: () => void
    onPublish: () => void
    // v1.17: el botón "Reroll" del card ahora regenera SOLO este
    // formato (preserva concept_id + hook + subtext + cta + target).
    // El reroll del concepto completo (2 banners nuevos) queda en el
    // heading del current batch.
    onRerollFormat: () => void
    onDownload: () => void
    onCopySpecs: () => void
    onDelete: () => void
    onRetryImage: () => void
    onZoom: (url: string) => void
}

function BannerCard({
    banner,
    isProcessing,
    autoRetryCount,
    autoRetriesExhausted,
    onApprove,
    onPublish,
    onRerollFormat,
    onDownload,
    onCopySpecs,
    onDelete,
    onRetryImage,
    onZoom,
}: BannerCardProps) {
    const catLabel = (() => {
        switch (banner.category) {
            case "veo":
                return "VEO"
            case "telekinesis":
                return "Telekinesis"
            case "calibracion":
                return "Calibración"
            case "sintonia":
                return "Sintonía"
        }
    })()
    const catClass = (() => {
        switch (banner.category) {
            case "veo":
                return "veo"
            case "telekinesis":
                return "tele"
            case "calibracion":
                return "cali"
            case "sintonia":
                return "sint"
        }
    })()
    const fmtLabel = (() => {
        switch (banner.banner_format) {
            case "feed_portrait":
                return "FEED 4:5"
            case "stories_9x16":
                return "STORIES 9:16"
        }
    })()
    const fmtClass = (() => {
        switch (banner.banner_format) {
            case "feed_portrait":
                return "feed"
            case "stories_9x16":
                return "stories"
        }
    })()
    const fmtFriendly = (() => {
        switch (banner.banner_format) {
            case "feed_portrait":
                return "Feed Instagram 4:5"
            case "stories_9x16":
                return "Stories Instagram 9:16"
        }
    })()
    const isPendingImage =
        !banner.image_r2_url && banner.status !== "rejected"
    const isFailedImage =
        !banner.image_r2_url && banner.status === "rejected"
    const secondsSinceGenerated =
        (Date.now() - new Date(banner.generated_at).getTime()) / 1000
    const isStuckPending =
        isPendingImage &&
        (autoRetriesExhausted ||
            secondsSinceGenerated >
                AUTO_RETRY_THRESHOLD_SEC * MAX_AUTO_RETRIES + 30)
    const cardClass =
        `at-card banner-${banner.banner_format} status-${banner.status}` +
        (isPendingImage && !isStuckPending ? " pending" : "") +
        (isFailedImage || isStuckPending ? " failed" : "")
    const statusLabel = (() => {
        switch (banner.status) {
            case "draft":
                return isStuckPending ? "Atascado" : "Borrador"
            case "approved":
                return "Aprobado"
            case "rejected":
                return "Rechazado"
            case "rerolled":
                return "Reroll"
            case "published":
                return "Exportado"
        }
    })()

    const isFinal = banner.status !== "draft" && banner.status !== "approved"

    return (
        <div className={cardClass}>
            <div
                className={`at-card-image banner-${banner.banner_format}`}
                onClick={() =>
                    banner.image_r2_url && onZoom(banner.image_r2_url)
                }
                style={
                    isPendingImage || isFailedImage
                        ? { cursor: "default" }
                        : undefined
                }
            >
                {banner.image_r2_url ? (
                    <img
                        src={banner.image_r2_url}
                        alt={banner.hook}
                        loading="lazy"
                    />
                ) : isFailedImage ? (
                    <div className="at-card-image-retry">
                        <div className="at-card-image-retry-label">
                            Imagen falló
                        </div>
                        <button
                            className="at-card-image-retry-btn"
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
                ) : isStuckPending ? (
                    <div className="at-card-image-retry">
                        <div className="at-card-image-retry-label">
                            Tiempo agotado
                        </div>
                        <button
                            className="at-card-image-retry-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRetryImage()
                            }}
                            disabled={isProcessing}
                            title="Regenerar la imagen reusando el mismo prompt"
                        >
                            ↻ Reintentar imagen
                        </button>
                        <button
                            className="at-card-image-delete-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            disabled={isProcessing}
                            title="Borrar este banner del panel"
                        >
                            ✕ Borrar card
                        </button>
                    </div>
                ) : (
                    <div className="at-card-image-pending">
                        <div className="at-card-image-spinner" />
                        <span>
                            {autoRetryCount > 0
                                ? `Reintentando ${autoRetryCount} de ${MAX_AUTO_RETRIES}`
                                : "Materializando"}
                        </span>
                    </div>
                )}
                <div className={`at-card-cat-pill ${catClass}`}>
                    {catLabel}
                </div>
                <div className={`at-card-format-pill ${fmtClass}`}>
                    {fmtLabel}
                </div>
                <div className={`at-card-status-pill ${banner.status}`}>
                    {statusLabel}
                </div>
            </div>

            <div className="at-card-body">
                <p className="at-card-target">
                    Hook · {fmtFriendly}
                </p>
                <p
                    className="at-card-aha"
                    style={{ fontStyle: "normal", fontWeight: 600 }}
                >
                    {banner.hook}
                </p>
                <p
                    className="at-card-caption"
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}
                >
                    {banner.subtext}
                </p>
                <p
                    className="at-card-hashtags"
                    style={{ marginTop: 4 }}
                    title="Texto del botón CTA visible en el banner"
                >
                    CTA · {banner.cta_label}
                </p>
                <p
                    className="at-card-hashtags"
                    style={{
                        color: "rgba(255,255,255,0.55)",
                        fontFamily:
                            "ui-monospace, 'JetBrains Mono', monospace",
                        marginTop: 2,
                    }}
                >
                    {banner.cta_url}
                </p>
                {banner.pulso_nucleo && (
                    <p className="at-card-pulso">
                        Pulso: {banner.pulso_nucleo}
                    </p>
                )}
            </div>

            <div className="at-card-actions">
                {banner.status === "approved" ? (
                    <button
                        className="at-action approve"
                        onClick={onPublish}
                        disabled={isProcessing}
                        title="Marcar como exportado a Meta Ads Manager (lo saca del feed activo)"
                    >
                        ↗ Exportado
                    </button>
                ) : (
                    <button
                        className="at-action approve"
                        onClick={onApprove}
                        disabled={
                            isProcessing || isFinal || !banner.image_r2_url
                        }
                        title="Aprobar este banner para campaña"
                    >
                        ✓ Aprobar
                    </button>
                )}
                <button
                    className="at-action reroll"
                    onClick={onRerollFormat}
                    disabled={isProcessing || !banner.image_r2_url}
                    title="Regenerar SOLO este formato manteniendo el concepto (hook, subtext, CTA intactos). Caso de uso: el otro formato del mismo concepto te gustó, este no. Costo: ~$0.07 USD."
                >
                    ↻ Reroll formato
                </button>
                <button
                    className="at-action download"
                    onClick={onDownload}
                    disabled={!banner.image_r2_url}
                    title="Descargar imagen del banner"
                >
                    ↓ Imagen
                </button>
                <button
                    className="at-action copy"
                    onClick={onCopySpecs}
                    title="Copiar hook + subtext + CTA + URL al portapapeles para subir a Meta Ads Manager"
                >
                    📋 Specs
                </button>
                <button
                    className="at-action delete"
                    onClick={onDelete}
                    disabled={isProcessing}
                    title="Borrar este banner del panel (soft delete, queda en memoria anti-repetición)"
                >
                    ✕ Borrar
                </button>
            </div>
        </div>
    )
}

/* ───────────────────────────────────────────────────────────────
   VideoCard — espejo de PostCard pero con <video> autoplay loop
   muted playsInline. Aspect 9:16 (Reels). Mismas 5 acciones.
   ─────────────────────────────────────────────────────────────── */

interface VideoCardProps {
    video: VtliVideo
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
    onRescueVideo: () => void
    onZoom: (url: string) => void
}

function VideoCard({
    video,
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
    onRescueVideo,
    onZoom,
}: VideoCardProps) {
    const catLabel = video.category === "veo" ? "VTLI Video" : "ZakHaar"
    const catClass = video.category === "veo" ? "veo" : "tele"
    const isPendingVideo =
        !video.video_r2_url && video.status !== "rejected"
    const isFailedVideo =
        !video.video_r2_url && video.status === "rejected"
    const secondsSinceGenerated =
        (Date.now() - new Date(video.generated_at).getTime()) / 1000
    // v1.10: video NO tiene auto-retry. Después de
    // VIDEO_STUCK_THRESHOLD_SEC (5 min) sin video_r2_url, el card
    // muestra botón manual "↻ Reintentar video". Cada intento son
    // $3 USD — Zak decide consciente. Standard 10s típicamente
    // completa en 60-120s, 5 min es buffer holgado.
    const isStuckPending =
        isPendingVideo && secondsSinceGenerated > VIDEO_STUCK_THRESHOLD_SEC
    const cardClass = `at-card status-${video.status}${isPendingVideo && !isStuckPending ? " pending" : ""}${isFailedVideo || isStuckPending ? " failed" : ""}`
    const statusLabel = (() => {
        switch (video.status) {
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

    const isFinal = video.status !== "draft" && video.status !== "approved"

    return (
        <div className={cardClass}>
            <div
                className="at-card-image is-video"
                onClick={() =>
                    video.video_r2_url && onZoom(video.video_r2_url)
                }
                style={
                    isPendingVideo || isFailedVideo
                        ? { cursor: "default" }
                        : undefined
                }
            >
                {video.video_r2_url ? (
                    <video
                        src={video.video_r2_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                    />
                ) : isFailedVideo ? (
                    <div className="at-card-image-retry">
                        <div className="at-card-image-retry-label">
                            Video falló
                        </div>
                        {video.replicate_prediction_id ? (
                            <>
                                <button
                                    className="at-card-image-rescue-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRescueVideo()
                                    }}
                                    disabled={isProcessing}
                                    title="Recuperar el video que ya existe en fal.ai sin gastar $3 USD (válido 24h desde generación)"
                                >
                                    💎 Rescatar gratis
                                </button>
                                <button
                                    className="at-card-image-retry-btn at-card-image-retry-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRetryImage()
                                    }}
                                    disabled={isProcessing}
                                    title="Generar uno completamente nuevo (cuesta $3 USD)"
                                >
                                    ↻ Generar nuevo ($3)
                                </button>
                            </>
                        ) : (
                            <button
                                className="at-card-image-retry-btn"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRetryImage()
                                }}
                                disabled={isProcessing}
                                title="Regenerar el video reusando el mismo prompt"
                            >
                                ↻ Reintentar video
                            </button>
                        )}
                        <button
                            className="at-card-image-delete-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            disabled={isProcessing}
                            title="Borrar este card del panel (soft delete: el pulso queda en memoria anti-repetición)"
                        >
                            ✕ Borrar card
                        </button>
                    </div>
                ) : isStuckPending ? (
                    <div className="at-card-image-retry">
                        <div className="at-card-image-retry-label">
                            Tiempo agotado
                        </div>
                        {video.replicate_prediction_id ? (
                            <>
                                <button
                                    className="at-card-image-rescue-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRescueVideo()
                                    }}
                                    disabled={isProcessing}
                                    title="El video probablemente ya existe en fal.ai. Rescatarlo sin gastar $3 USD más (válido 24h desde generación)"
                                >
                                    💎 Rescatar gratis
                                </button>
                                <button
                                    className="at-card-image-retry-btn at-card-image-retry-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRetryImage()
                                    }}
                                    disabled={isProcessing}
                                    title="Generar uno completamente nuevo (cuesta $3 USD)"
                                >
                                    ↻ Generar nuevo ($3)
                                </button>
                            </>
                        ) : (
                            <button
                                className="at-card-image-retry-btn"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRetryImage()
                                }}
                                disabled={isProcessing}
                                title="Regenerar el video reusando el mismo prompt"
                            >
                                ↻ Reintentar video
                            </button>
                        )}
                        <button
                            className="at-card-image-delete-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            disabled={isProcessing}
                            title="Borrar este card del panel (soft delete: el pulso queda en memoria anti-repetición)"
                        >
                            ✕ Borrar card
                        </button>
                    </div>
                ) : (
                    <div className="at-card-image-pending">
                        <div className="at-card-image-spinner" />
                        <span>Materializando · puede tomar 1-3 min</span>
                    </div>
                )}
                <div className={`at-card-cat-pill ${catClass}`}>
                    {catLabel}
                </div>
                <div className={`at-card-status-pill ${video.status}`}>
                    {statusLabel}
                </div>
            </div>

            <div className="at-card-body">
                <p className="at-card-target">
                    {video.target.replace(/_/g, " ")}
                </p>
                {video.aha_moment && (
                    <p className="at-card-aha">"{video.aha_moment}"</p>
                )}
                <pre className="at-card-caption">{video.caption}</pre>
                {video.hashtags.length > 0 && (
                    <p className="at-card-hashtags">
                        {video.hashtags.map((h) => `#${h}`).join(" ")}
                    </p>
                )}
                {video.pulso_nucleo && (
                    <p className="at-card-pulso">
                        Pulso: {video.pulso_nucleo}
                    </p>
                )}
            </div>

            <div className="at-card-actions">
                {video.status === "approved" ? (
                    <button
                        className="at-action approve"
                        onClick={onPublish}
                        disabled={isProcessing}
                        title="Marcar como publicado en Instagram (lo saca del feed activo)"
                    >
                        ↗ Publicar
                    </button>
                ) : (
                    <button
                        className="at-action approve"
                        onClick={onApprove}
                        disabled={
                            isProcessing || isFinal || !video.video_r2_url
                        }
                        title="Aprobar para alimentar memoria anti-repetición"
                    >
                        ✓ Aprobar
                    </button>
                )}
                <button
                    className="at-action reroll"
                    onClick={onReroll}
                    disabled={
                        isProcessing || isFinal || !video.video_r2_url
                    }
                    title="Generar variante nueva apuntando a este como padre"
                >
                    ↻ Reroll
                </button>
                <button
                    className="at-action download"
                    onClick={onDownload}
                    disabled={!video.video_r2_url}
                    title="Descargar mp4 720p 9:16"
                >
                    ↓ Video
                </button>
                <button
                    className="at-action copy"
                    onClick={onCopy}
                    title="Copiar caption + hashtags al portapapeles"
                >
                    📋 Texto
                </button>
                <button
                    className="at-action delete"
                    onClick={onDelete}
                    disabled={isProcessing}
                    title="Borrar este video de la base de datos"
                >
                    ✕ Borrar
                </button>
            </div>
        </div>
    )
}

interface HistoryThumbProps {
    post: VtliPost
    onClick: () => void
}

function HistoryThumb({ post, onClick }: HistoryThumbProps) {
    const statusShort = (() => {
        switch (post.status) {
            case "approved":
                return "OK"
            case "rejected":
                return "NO"
            case "rerolled":
                return "↻"
            case "published":
                return "PUB"
            default:
                return "•"
        }
    })()
    return (
        <div className="at-history-thumb" onClick={onClick}>
            {post.image_r2_url ? (
                <img src={post.image_r2_url} alt={post.target} loading="lazy" />
            ) : (
                <div className="at-card-image-placeholder">—</div>
            )}
            <div className="at-thumb-status">{statusShort}</div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   5. MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function AtelierMarketing({
    supabaseUrl = "",
    supabaseAnonKey = "",
}: PanelProps) {
    const { isAdmin, loading, userId } = useAdminAuth(
        supabaseUrl,
        supabaseAnonKey
    )
    const isMobile = useIsMobile()
    // Recuerda la pestaña activa entre recargas: si recargas estando en
    // "Zak'Haar Posts", vuelve a abrir ahí mismo (no en la primera pestaña).
    const [activeSubTab, setActiveSubTab] = useState<SubTab>(() => {
        try {
            const saved =
                typeof localStorage !== "undefined"
                    ? localStorage.getItem("rsv_atelier_subtab")
                    : null
            const valid = [
                "veo_instagram",
                "vtli_banners",
                "veo_video",
                "estudio_manual",
                "zakhaar_posts",
                "soma_cero",
            ]
            if (saved && valid.includes(saved)) return saved as SubTab
        } catch {}
        return "veo_instagram"
    })
    useEffect(() => {
        try {
            localStorage.setItem("rsv_atelier_subtab", activeSubTab)
        } catch {}
    }, [activeSubTab])
    const [generating, setGenerating] = useState<VtliCategory | null>(null)
    const [processingPostId, setProcessingPostId] = useState<string | null>(
        null
    )
    // Modo de imagen para la generación de posts: "prompts" (manual: solo da el
    // prompt, $0 — DEFAULT, es el que más usamos) o "api" (genera por API).
    const [imageMode, setImageMode] = useState<"api" | "prompts">("prompts")
    // Siempre 1 generación por ejecución (decisión de Zak — sin batch).
    const postCount = 1
    const [uploadingPostId, setUploadingPostId] = useState<string | null>(null)
    const [currentBatch, setCurrentBatch] = useState<VtliPost[]>([])
    const [history, setHistory] = useState<VtliPost[]>([])
    const [dashboard, setDashboard] = useState<AtelierDashboard | null>(null)
    // v1.19 — Fila de conteos colapsada por defecto; el botón "Número de
    // posts emitidos" la despliega.
    const [showStats, setShowStats] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    // v1.7: lightbox ahora soporta image o video. Si .mp4 → render <video>.
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const [histCategoryFilter, setHistCategoryFilter] = useState<
        VtliCategory | "all"
    >("all")
    const [histStatusFilter, setHistStatusFilter] = useState<
        VtliStatus | "all" | "incomplete"
    >("all")

    /* ─── v1.7: estado del Atelier de Video ─── */
    const [currentVideoBatch, setCurrentVideoBatch] = useState<VtliVideo[]>(
        []
    )
    const [historyVideo, setHistoryVideo] = useState<VtliVideo[]>([])
    const [dashboardVideo, setDashboardVideo] =
        useState<AtelierVideoDashboard | null>(null)
    const [generatingVideo, setGeneratingVideo] =
        useState<VtliVideoCategory | null>(null)
    const [processingVideoId, setProcessingVideoId] = useState<
        string | null
    >(null)
    const [histVideoCategoryFilter, setHistVideoCategoryFilter] = useState<
        VtliVideoCategory | "all"
    >("all")
    const [histVideoStatusFilter, setHistVideoStatusFilter] = useState<
        VtliVideoStatus | "all" | "incomplete"
    >("all")

    /* ─── v1.15: estado del Atelier de Banners (paralelo a posts) ─── */
    const [currentBannerBatch, setCurrentBannerBatch] = useState<VtliBanner[]>(
        []
    )
    const [bannerHistory, setBannerHistory] = useState<VtliBanner[]>([])
    const [bannersDashboard, setBannersDashboard] =
        useState<AtelierBannersDashboard | null>(null)
    const [generatingBanner, setGeneratingBanner] =
        useState<VtliCategory | null>(null)
    const [processingBannerId, setProcessingBannerId] = useState<
        string | null
    >(null)
    const [histBannerCategoryFilter, setHistBannerCategoryFilter] = useState<
        VtliCategory | "all"
    >("all")
    const [histBannerFormatFilter, setHistBannerFormatFilter] = useState<
        VtliBannerFormat | "all"
    >("all")
    const [histBannerStatusFilter, setHistBannerStatusFilter] = useState<
        VtliBannerStatus | "all" | "incomplete"
    >("all")

    /* ─── CSS injection (una vez por mount del documento) ─── */
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "at-css"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])

    /* ─── Loaders ─── */
    const loadDashboard = useCallback(async () => {
        if (!isAdmin || !userId) return
        const r = await rpc(supabaseUrl, supabaseAnonKey, "get_atelier_dashboard", {
            p_admin_clerk_id: userId,
        })
        if (r && r.is_admin) setDashboard(r as AtelierDashboard)
    }, [isAdmin, userId, supabaseUrl, supabaseAnonKey])

    const loadHistory = useCallback(async () => {
        if (!isAdmin || !userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_recent_vtli_posts",
            {
                p_admin_clerk_id: userId,
                p_category: null,
                p_status: null,
                p_limit: 60,
            }
        )
        if (r && Array.isArray(r.posts)) {
            setHistory(r.posts as VtliPost[])
        }
    }, [isAdmin, userId, supabaseUrl, supabaseAnonKey])

    /* ─── v1.7: loaders del Atelier de Video ─── */
    const loadDashboardVideo = useCallback(async () => {
        if (!isAdmin || !userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_atelier_video_dashboard",
            { p_admin_clerk_id: userId }
        )
        if (r && r.is_admin) setDashboardVideo(r as AtelierVideoDashboard)
    }, [isAdmin, userId, supabaseUrl, supabaseAnonKey])

    const loadHistoryVideo = useCallback(async () => {
        if (!isAdmin || !userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_recent_vtli_videos",
            {
                p_admin_clerk_id: userId,
                p_category: null,
                p_status: null,
                p_limit: 60,
            }
        )
        if (r && Array.isArray(r.videos)) {
            setHistoryVideo(r.videos as VtliVideo[])
        }
    }, [isAdmin, userId, supabaseUrl, supabaseAnonKey])

    /* ─── v1.15: loaders del Atelier de Banners ─── */
    const loadBannersDashboard = useCallback(async () => {
        if (!isAdmin || !userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_atelier_banners_dashboard",
            { p_admin_clerk_id: userId }
        )
        if (r && r.is_admin) {
            setBannersDashboard(r as AtelierBannersDashboard)
        }
    }, [isAdmin, userId, supabaseUrl, supabaseAnonKey])

    const loadBannerHistory = useCallback(async () => {
        if (!isAdmin || !userId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_recent_vtli_banners",
            {
                p_admin_clerk_id: userId,
                p_category: null,
                p_banner_format: null,
                p_status: null,
                p_limit: 60, // hasta 30 conceptos (60 = 30 × 2 formatos)
            }
        )
        if (r && Array.isArray(r.banners)) {
            setBannerHistory(r.banners as VtliBanner[])
        }
    }, [isAdmin, userId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        if (isAdmin && userId) {
            loadDashboard()
            loadHistory()
            loadDashboardVideo()
            loadHistoryVideo()
            loadBannersDashboard()
            loadBannerHistory()
        }
    }, [
        isAdmin,
        userId,
        loadDashboard,
        loadHistory,
        loadDashboardVideo,
        loadHistoryVideo,
        loadBannersDashboard,
        loadBannerHistory,
    ])

    /* ─── Handlers ─── */
    const showToast = useCallback((msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 2200)
    }, [])

    const handleGenerate = useCallback(
        async (category: VtliCategory) => {
            if (!userId || generating) return
            setErrorMsg(null)
            setGenerating(category)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-posts`
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
                        count: postCount,
                        image_mode: imageMode,
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(
                        data?.error || `HTTP ${res.status}`
                    )
                }
                if (Array.isArray(data?.posts) && data.posts.length > 0) {
                    setCurrentBatch(data.posts as VtliPost[])
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
                console.error("[atelier:gen]", err)
                setErrorMsg(
                    `Error generando ${category}: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setGenerating(null)
            }
        },
        [
            userId,
            generating,
            imageMode,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboard,
            loadHistory,
        ]
    )

    const handleReroll = useCallback(
        async (postId: string) => {
            if (!userId || processingPostId) return
            setProcessingPostId(postId)
            setErrorMsg(null)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-posts`
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
                if (!res.ok) {
                    throw new Error(data?.error || `HTTP ${res.status}`)
                }
                if (Array.isArray(data?.posts) && data.posts.length > 0) {
                    const newPost = data.posts[0] as VtliPost
                    // Reemplazar el padre por el hijo en la grid actual.
                    // El hijo viene con image_r2_url=null; el polling lo
                    // completa cuando la imagen background termine.
                    setCurrentBatch((prev) =>
                        prev.map((p) => (p.id === postId ? newPost : p))
                    )
                    showToast("Reroll en curso · imagen materializando")
                }
                loadDashboard()
                loadHistory()
            } catch (err: any) {
                console.error("[atelier:reroll]", err)
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

    const handleUpdateStatus = useCallback(
        async (postId: string, newStatus: VtliStatus) => {
            if (!userId || processingPostId) return
            setProcessingPostId(postId)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "update_vtli_post_status",
                    {
                        p_admin_clerk_id: userId,
                        p_post_id: postId,
                        p_new_status: newStatus,
                    }
                )
                if (r?.success) {
                    setCurrentBatch((prev) =>
                        prev.map((p) =>
                            p.id === postId ? { ...p, status: newStatus } : p
                        )
                    )
                    const labels: Record<VtliStatus, string> = {
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

    const handleDownload = useCallback(
        (post: VtliPost) => {
            if (!post.image_r2_url) return
            // El dominio público de R2 (pub-*.r2.dev) no aplica CORS, así
            // que fetch() fallaba con "Failed to fetch" (aunque <img> sí
            // muestra). El proxy `descargar-media` trae el archivo
            // server-side y lo devuelve con Content-Disposition:
            // attachment → descarga directa en 1 click, sin CORS.
            const filename = `vtli_${post.category}_${post.target}_${post.id.slice(0, 8)}.png`
            const proxy = `${supabaseUrl}/functions/v1/descargar-media?url=${encodeURIComponent(post.image_r2_url)}&filename=${encodeURIComponent(filename)}`
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
        async (post: VtliPost) => {
            try {
                const text = `${post.caption}\n\n${post.hashtags
                    .map((h) => `#${h}`)
                    .join(" ")}`
                await navigator.clipboard.writeText(text)
                showToast("Texto copiado")
            } catch (err: any) {
                console.error("[atelier:copy]", err)
                setErrorMsg(`Copia falló: ${err?.message ?? "desconocido"}`)
            }
        },
        [showToast]
    )

    // Modo manual: copiar el prompt de imagen para pegarlo en Nano Banana.
    const handleCopyPrompt = useCallback(
        async (post: VtliPost) => {
            try {
                await navigator.clipboard.writeText(post.prompt_visual || "")
                showToast("Prompt copiado")
            } catch (err: any) {
                setErrorMsg(`Copia falló: ${err?.message ?? "desconocido"}`)
            }
        },
        [showToast]
    )

    // Modo manual: subir la imagen final hecha a mano → R2 → image_r2_url.
    const updatePostInState = useCallback(
        (postId: string, patch: Partial<VtliPost>) => {
            const apply = (prev: VtliPost[]) =>
                prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
            setCurrentBatch(apply)
            setHistory(apply)
        },
        []
    )

    const handleUploadPostImage = useCallback(
        async (postId: string, file: File) => {
            if (!userId || uploadingPostId) return
            setUploadingPostId(postId)
            try {
                const { base64, mime } = await resizePostImageToBase64(file, 1080)
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
                setErrorMsg(`No se pudo subir la imagen: ${err?.message ?? err}`)
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
        async (post: VtliPost) => {
            if (!userId) return
            const next = !post.is_published
            updatePostInState(post.id, { is_published: next })
            const r = await rpc(
                supabaseUrl,
                supabaseAnonKey,
                "set_vtli_post_published",
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
        async (post: VtliPost) => {
            if (!userId || processingPostId) return
            const preview = post.aha_moment
                ? `"${post.aha_moment.slice(0, 90)}${post.aha_moment.length > 90 ? "…" : ""}"`
                : `target: ${post.target}`
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
                    "delete_vtli_post",
                    {
                        p_admin_clerk_id: userId,
                        p_post_id: post.id,
                    }
                )
                if (r?.success) {
                    setCurrentBatch((prev) =>
                        prev.filter((p) => p.id !== post.id)
                    )
                    setHistory((prev) =>
                        prev.filter((p) => p.id !== post.id)
                    )
                    showToast("Post borrado")
                    loadDashboard()
                } else {
                    setErrorMsg(r?.error || "No se pudo borrar el post")
                }
            } catch (err: any) {
                console.error("[atelier:delete]", err)
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

    /* ─── Retry image — reusa el prompt_visual de un card atascado/fallado
       y regenera SOLO la imagen via modo retry_image_only_for_post_id de
       generate-vtli-posts v3.2. Reset visual optimista (image_r2_url=null
       + status=draft + generated_at=now) para que el card vuelva al modo
       "Materializando" mientras el polling existente recoge la nueva URL. */
    const handleRetryImage = useCallback(
        async (postId: string) => {
            if (!userId) return
            // v1.6: el retry manual resetea el contador automático a 0,
            // dando otros 5 reintentos automáticos antes del próximo botón.
            autoRetriedRef.current.delete(postId)
            setRetryTick((n) => n + 1)
            // Reset visual optimista
            const nowIso = new Date().toISOString()
            const resetter = (prev: VtliPost[]) =>
                prev.map((p) =>
                    p.id === postId
                        ? {
                              ...p,
                              image_r2_url: null,
                              status: "draft" as VtliStatus,
                              generated_at: nowIso,
                          }
                        : p
                )
            setCurrentBatch(resetter)
            setHistory(resetter)
            // Fire-and-forget al backend; el polling unificado refrescará
            // el card cuando image_r2_url se popule.
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-posts`
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
                        retry_image_only_for_post_id: postId,
                    }),
                })
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(
                        data?.error || `HTTP ${res.status}`
                    )
                }
                showToast("Reintentando imagen…")
            } catch (err: any) {
                console.error("[atelier:retry]", err)
                setErrorMsg(
                    `Reintento falló: ${err?.message ?? "desconocido"}`
                )
            }
        },
        [userId, supabaseUrl, supabaseAnonKey, showToast]
    )

    /* ─── v1.7: handlers del Atelier de Video ─── */
    const handleGenerateVideo = useCallback(
        async (category: VtliVideoCategory) => {
            if (!userId || generatingVideo) return
            setErrorMsg(null)
            setGeneratingVideo(category)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-video`
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
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data?.error || `HTTP ${res.status}`)
                }
                if (data?.video?.id) {
                    setCurrentVideoBatch((prev) => [
                        data.video as VtliVideo,
                        ...prev,
                    ])
                    showToast("Copy listo · video materializando en Seedance")
                } else {
                    throw new Error("Respuesta vacía del motor de video")
                }
                loadDashboardVideo()
                loadHistoryVideo()
            } catch (err: any) {
                console.error("[atelier:gen-video]", err)
                setErrorMsg(
                    `Error generando video ${category}: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setGeneratingVideo(null)
            }
        },
        [
            userId,
            generatingVideo,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboardVideo,
            loadHistoryVideo,
            showToast,
        ]
    )

    const handleRerollVideo = useCallback(
        async (videoId: string) => {
            if (!userId || processingVideoId) return
            setProcessingVideoId(videoId)
            setErrorMsg(null)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-video`
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
                        reroll_of_video_id: videoId,
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data?.error || `HTTP ${res.status}`)
                }
                if (data?.video?.id) {
                    setCurrentVideoBatch((prev) =>
                        prev.map((v) =>
                            v.id === videoId
                                ? (data.video as VtliVideo)
                                : v
                        )
                    )
                    showToast("Reroll en curso · video materializando")
                }
                loadDashboardVideo()
                loadHistoryVideo()
            } catch (err: any) {
                console.error("[atelier:reroll-video]", err)
                setErrorMsg(
                    `Reroll video falló: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setProcessingVideoId(null)
            }
        },
        [
            userId,
            processingVideoId,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboardVideo,
            loadHistoryVideo,
            showToast,
        ]
    )

    const handleUpdateVideoStatus = useCallback(
        async (videoId: string, newStatus: VtliVideoStatus) => {
            if (!userId || processingVideoId) return
            setProcessingVideoId(videoId)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "update_vtli_video_status",
                    {
                        p_admin_clerk_id: userId,
                        p_video_id: videoId,
                        p_new_status: newStatus,
                    }
                )
                if (r?.success) {
                    setCurrentVideoBatch((prev) =>
                        prev.map((v) =>
                            v.id === videoId
                                ? { ...v, status: newStatus }
                                : v
                        )
                    )
                    const labels: Record<VtliVideoStatus, string> = {
                        draft: "Borrador",
                        approved: "Aprobado",
                        rejected: "Rechazado",
                        rerolled: "Reroll",
                        published: "Publicado",
                    }
                    showToast(labels[newStatus])
                    loadDashboardVideo()
                    loadHistoryVideo()
                } else {
                    setErrorMsg(
                        r?.error || "No se pudo actualizar el estado"
                    )
                }
            } finally {
                setProcessingVideoId(null)
            }
        },
        [
            userId,
            processingVideoId,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboardVideo,
            loadHistoryVideo,
            showToast,
        ]
    )

    const handleDownloadVideo = useCallback(
        (video: VtliVideo) => {
            if (!video.video_r2_url) return
            // Descarga vía proxy `descargar-media` (r2.dev no aplica CORS).
            const filename = `vtli_${video.category}_${video.target}_${video.id.slice(0, 8)}.mp4`
            const proxy = `${supabaseUrl}/functions/v1/descargar-media?url=${encodeURIComponent(video.video_r2_url)}&filename=${encodeURIComponent(filename)}`
            const a = document.createElement("a")
            a.href = proxy
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            showToast("Descargando video…")
        },
        [showToast, supabaseUrl]
    )

    const handleCopyVideo = useCallback(
        async (video: VtliVideo) => {
            try {
                const text = `${video.caption}\n\n${video.hashtags
                    .map((h) => `#${h}`)
                    .join(" ")}`
                await navigator.clipboard.writeText(text)
                showToast("Texto copiado")
            } catch (err: any) {
                console.error("[atelier:copy-video]", err)
                setErrorMsg(
                    `Copia falló: ${err?.message ?? "desconocido"}`
                )
            }
        },
        [showToast]
    )

    const handleDeleteVideo = useCallback(
        async (video: VtliVideo) => {
            if (!userId || processingVideoId) return
            const preview = video.aha_moment
                ? `"${video.aha_moment.slice(0, 90)}${video.aha_moment.length > 90 ? "…" : ""}"`
                : `target: ${video.target}`
            const confirmed =
                typeof window !== "undefined"
                    ? window.confirm(
                          `Borrar este video para siempre?\n\n${preview}\n\nEl mp4 R2 queda huérfano en el bucket — no se borra automáticamente.`
                      )
                    : false
            if (!confirmed) return
            setProcessingVideoId(video.id)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "delete_vtli_video",
                    {
                        p_admin_clerk_id: userId,
                        p_video_id: video.id,
                    }
                )
                if (r?.success) {
                    setCurrentVideoBatch((prev) =>
                        prev.filter((v) => v.id !== video.id)
                    )
                    setHistoryVideo((prev) =>
                        prev.filter((v) => v.id !== video.id)
                    )
                    showToast("Video borrado")
                    loadDashboardVideo()
                } else {
                    setErrorMsg(r?.error || "No se pudo borrar el video")
                }
            } catch (err: any) {
                console.error("[atelier:delete-video]", err)
                setErrorMsg(
                    `Borrado video falló: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setProcessingVideoId(null)
            }
        },
        [
            userId,
            processingVideoId,
            supabaseUrl,
            supabaseAnonKey,
            loadDashboardVideo,
            showToast,
        ]
    )

    const handleRetryVideo = useCallback(
        async (videoId: string) => {
            if (!userId) return
            // Reset contador automático y visual optimista
            autoRetriedVideoRef.current.delete(videoId)
            setRetryTick((n) => n + 1)
            const nowIso = new Date().toISOString()
            const resetter = (prev: VtliVideo[]) =>
                prev.map((v) =>
                    v.id === videoId
                        ? {
                              ...v,
                              video_r2_url: null,
                              status: "draft" as VtliVideoStatus,
                              generated_at: nowIso,
                          }
                        : v
                )
            setCurrentVideoBatch(resetter)
            setHistoryVideo(resetter)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-video`
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
                        retry_video_only_for_video_id: videoId,
                    }),
                })
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(
                        data?.error || `HTTP ${res.status}`
                    )
                }
                showToast("Reintentando video…")
            } catch (err: any) {
                console.error("[atelier:retry-video]", err)
                setErrorMsg(
                    `Reintento video falló: ${err?.message ?? "desconocido"}`
                )
            }
        },
        [userId, supabaseUrl, supabaseAnonKey, showToast]
    )

    /* v1.11: RESCATE GRATIS. El video YA existe en fal.ai por 24h,
       no hace falta volver a pagar $3 USD. El backend reusa el
       replicate_prediction_id guardado, salta submit + polling y va
       directo a download + R2 upload + PATCH. Reset visual idéntico al
       retry para que el card vuelva a "Materializando" mientras el
       polling recoge la URL real. */
    const handleRescueVideo = useCallback(
        async (videoId: string) => {
            if (!userId) return
            // Reset visual optimista — card vuelve a "Materializando"
            const nowIso = new Date().toISOString()
            const resetter = (prev: VtliVideo[]) =>
                prev.map((v) =>
                    v.id === videoId
                        ? {
                              ...v,
                              video_r2_url: null,
                              status: "draft" as VtliVideoStatus,
                              generated_at: nowIso,
                          }
                        : v
                )
            setCurrentVideoBatch(resetter)
            setHistoryVideo(resetter)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-video`
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
                        rescue_video_from_fal_for_video_id: videoId,
                    }),
                })
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(
                        data?.detail || data?.error || `HTTP ${res.status}`
                    )
                }
                showToast("Rescatando video sin costo…")
            } catch (err: any) {
                console.error("[atelier:rescue-video]", err)
                setErrorMsg(
                    `Rescate falló: ${err?.message ?? "desconocido"}. Si fal.ai expiró el resultado (>24h), generá uno nuevo ($3 USD).`
                )
            }
        },
        [userId, supabaseUrl, supabaseAnonKey, showToast]
    )

    /* ─── v1.15: handlers del Atelier de Banners ─── */

    const handleGenerateBanner = useCallback(
        async (category: VtliCategory) => {
            if (!userId || generatingBanner) return
            setErrorMsg(null)
            setGeneratingBanner(category)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-banners`
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
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data?.error || `HTTP ${res.status}`)
                }
                if (
                    Array.isArray(data?.banners) &&
                    data.banners.length > 0
                ) {
                    setCurrentBannerBatch(data.banners as VtliBanner[])
                    showToast(
                        `Concepto listo · 2 banners materializando`
                    )
                } else {
                    throw new Error("Respuesta vacía del motor")
                }
                loadBannersDashboard()
                loadBannerHistory()
            } catch (err: any) {
                console.error("[banners:gen]", err)
                setErrorMsg(
                    `Error generando banner ${category}: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setGeneratingBanner(null)
            }
        },
        [
            userId,
            generatingBanner,
            supabaseUrl,
            supabaseAnonKey,
            loadBannersDashboard,
            loadBannerHistory,
            showToast,
        ]
    )

    // v1.17: reroll de UN solo formato preservando el concepto cerrado
    // (hook, subtext, cta, target, pulso). Caso de uso: te encantó el
    // feed 4:5 pero el stories 9:16 del mismo concepto salió mal —
    // regeneramos solo el stories manteniendo todo lo demás.
    const handleRerollBannerFormat = useCallback(
        async (banner: VtliBanner) => {
            if (!userId) return
            setErrorMsg(null)
            setProcessingBannerId(banner.id)
            // Reset visual optimista del card
            const nowIso = new Date().toISOString()
            const resetter = (prev: VtliBanner[]) =>
                prev.map((b) =>
                    b.id === banner.id
                        ? {
                              ...b,
                              image_r2_url: null,
                              status: "draft" as VtliBannerStatus,
                              generated_at: nowIso,
                          }
                        : b
                )
            setCurrentBannerBatch(resetter)
            setBannerHistory(resetter)
            autoRetriedBannerRef.current.delete(banner.id)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-banners`
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
                        reroll_format_only_for_banner_id: banner.id,
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data?.error || `HTTP ${res.status}`)
                }
                showToast(
                    `Regenerando ${banner.banner_format === "feed_portrait" ? "feed" : "stories"} (preservando concepto)`
                )
                // El polling unificado va a detectar el image_r2_url
                // nuevo cuando background termine.
                loadBannersDashboard()
            } catch (err: any) {
                console.error("[banners:reroll-format]", err)
                setErrorMsg(
                    `Error rerolleando formato: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setProcessingBannerId(null)
            }
        },
        [
            userId,
            supabaseUrl,
            supabaseAnonKey,
            loadBannersDashboard,
            showToast,
        ]
    )

    const handleRerollBannerConcept = useCallback(
        async (banner: VtliBanner) => {
            if (!userId || generatingBanner) return
            const conceptId = banner.concept_id
            setErrorMsg(null)
            setProcessingBannerId(banner.id)
            try {
                const url = `${supabaseUrl}/functions/v1/generate-vtli-banners`
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
                        reroll_of_concept_id: conceptId,
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data?.error || `HTTP ${res.status}`)
                }
                if (
                    Array.isArray(data?.banners) &&
                    data.banners.length > 0
                ) {
                    setCurrentBannerBatch(data.banners as VtliBanner[])
                    showToast(
                        `Concepto rerolleado · 2 banners materializando`
                    )
                }
                loadBannersDashboard()
                loadBannerHistory()
            } catch (err: any) {
                console.error("[banners:reroll]", err)
                setErrorMsg(
                    `Error rerolleando concepto: ${err?.message ?? "desconocido"}`
                )
            } finally {
                setProcessingBannerId(null)
            }
        },
        [
            userId,
            generatingBanner,
            supabaseUrl,
            supabaseAnonKey,
            loadBannersDashboard,
            loadBannerHistory,
            showToast,
        ]
    )

    const handleUpdateBannerStatus = useCallback(
        async (bannerId: string, newStatus: VtliBannerStatus) => {
            if (!userId) return
            setProcessingBannerId(bannerId)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "update_vtli_banner_status",
                    {
                        p_admin_clerk_id: userId,
                        p_banner_id: bannerId,
                        p_new_status: newStatus,
                    }
                )
                if (r?.success) {
                    const updater = (prev: VtliBanner[]) =>
                        prev.map((b) =>
                            b.id === bannerId ? { ...b, status: newStatus } : b
                        )
                    setCurrentBannerBatch(updater)
                    setBannerHistory(updater)
                    showToast(`Banner ${newStatus}`)
                    loadBannersDashboard()
                } else {
                    setErrorMsg(`Error: ${r?.error ?? "actualización fallida"}`)
                }
            } catch (err: any) {
                console.error("[banners:status]", err)
                setErrorMsg(`Error: ${err?.message ?? "desconocido"}`)
            } finally {
                setProcessingBannerId(null)
            }
        },
        [
            userId,
            supabaseUrl,
            supabaseAnonKey,
            loadBannersDashboard,
            showToast,
        ]
    )

    const handleDeleteBanner = useCallback(
        async (banner: VtliBanner) => {
            if (!userId) return
            const confirmDelete = window.confirm(
                `¿Borrar este banner (${banner.banner_format}) del concepto "${banner.hook}"? Soft delete: el pulso queda en memoria anti-repetición pero el card desaparece del panel.`
            )
            if (!confirmDelete) return
            setProcessingBannerId(banner.id)
            try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "delete_vtli_banner",
                    {
                        p_admin_clerk_id: userId,
                        p_banner_id: banner.id,
                    }
                )
                if (r?.success) {
                    setCurrentBannerBatch((prev) =>
                        prev.filter((b) => b.id !== banner.id)
                    )
                    setBannerHistory((prev) =>
                        prev.filter((b) => b.id !== banner.id)
                    )
                    showToast("Banner borrado")
                    loadBannersDashboard()
                } else {
                    setErrorMsg(`Error: ${r?.error ?? "borrado falló"}`)
                }
            } catch (err: any) {
                console.error("[banners:delete]", err)
                setErrorMsg(`Error: ${err?.message ?? "desconocido"}`)
            } finally {
                setProcessingBannerId(null)
            }
        },
        [
            userId,
            supabaseUrl,
            supabaseAnonKey,
            loadBannersDashboard,
            showToast,
        ]
    )

    const handleRetryBannerImage = useCallback(
        async (bannerId: string) => {
            if (!userId) return
            // Reset visual optimista
            const nowIso = new Date().toISOString()
            const resetter = (prev: VtliBanner[]) =>
                prev.map((b) =>
                    b.id === bannerId
                        ? {
                              ...b,
                              image_r2_url: null,
                              status: "draft" as VtliBannerStatus,
                              generated_at: nowIso,
                          }
                        : b
                )
            setCurrentBannerBatch(resetter)
            setBannerHistory(resetter)
            autoRetriedBannerRef.current.delete(bannerId)
            try {
                await fetch(
                    `${supabaseUrl}/functions/v1/generate-vtli-banners`,
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
                            retry_image_only_for_banner_id: bannerId,
                        }),
                    }
                )
                showToast("Regenerando imagen del banner")
            } catch (err) {
                console.warn("[banners:retry]", err)
            }
        },
        [userId, supabaseUrl, supabaseAnonKey, showToast]
    )

    const handleDownloadBanner = useCallback(
        (banner: VtliBanner) => {
            if (!banner.image_r2_url) return
            // Descarga vía proxy `descargar-media` (r2.dev no aplica CORS).
            const filename = `vtli_banner_${banner.category}_${banner.banner_format}_${banner.id.slice(0, 8)}.png`
            const proxy = `${supabaseUrl}/functions/v1/descargar-media?url=${encodeURIComponent(banner.image_r2_url)}&filename=${encodeURIComponent(filename)}`
            const a = document.createElement("a")
            a.href = proxy
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            showToast("Descargando banner…")
        },
        [showToast, supabaseUrl]
    )

    const handleCopyBannerSpecs = useCallback(
        async (banner: VtliBanner) => {
            const specs =
                `HOOK: ${banner.hook}\n` +
                `SUBTEXT: ${banner.subtext}\n` +
                `CTA: ${banner.cta_label}\n` +
                `URL: ${banner.cta_url}\n` +
                `FORMATO: ${banner.banner_format}\n` +
                `PILAR: ${banner.category}\n` +
                `TARGET: ${banner.target}`
            try {
                await navigator.clipboard.writeText(specs)
                showToast("Specs copiadas")
            } catch {
                setErrorMsg("Copy falló — copialo manual")
            }
        },
        [showToast]
    )

    /* ─── Memoized filtered history ─── */
    const filteredHistory = useMemo(() => {
        const currentIds = new Set(currentBatch.map((p) => p.id))
        return history
            .filter((p) => !currentIds.has(p.id))
            .filter(
                (p) =>
                    histCategoryFilter === "all" ||
                    p.category === histCategoryFilter
            )
            .filter((p) => {
                if (histStatusFilter === "all") return true
                if (histStatusFilter === "incomplete") {
                    return (
                        !p.image_r2_url || p.status === "rejected"
                    )
                }
                return p.status === histStatusFilter
            })
    }, [history, currentBatch, histCategoryFilter, histStatusFilter])

    /* ─── v1.7: filtered history para videos ─── */
    const filteredHistoryVideo = useMemo(() => {
        const currentIds = new Set(currentVideoBatch.map((v) => v.id))
        return historyVideo
            .filter((v) => !currentIds.has(v.id))
            .filter(
                (v) =>
                    histVideoCategoryFilter === "all" ||
                    v.category === histVideoCategoryFilter
            )
            .filter((v) => {
                if (histVideoStatusFilter === "all") return true
                if (histVideoStatusFilter === "incomplete") {
                    return (
                        !v.video_r2_url || v.status === "rejected"
                    )
                }
                return v.status === histVideoStatusFilter
            })
    }, [
        historyVideo,
        currentVideoBatch,
        histVideoCategoryFilter,
        histVideoStatusFilter,
    ])

    /* ─── v1.15: filtered history para Banners ─── */
    const filteredBannerHistory = useMemo(() => {
        const currentIds = new Set(currentBannerBatch.map((b) => b.id))
        return bannerHistory
            .filter((b) => !currentIds.has(b.id))
            .filter(
                (b) =>
                    histBannerCategoryFilter === "all" ||
                    b.category === histBannerCategoryFilter
            )
            .filter(
                (b) =>
                    histBannerFormatFilter === "all" ||
                    b.banner_format === histBannerFormatFilter
            )
            .filter((b) => {
                if (histBannerStatusFilter === "all") return true
                if (histBannerStatusFilter === "incomplete") {
                    return !b.image_r2_url || b.status === "rejected"
                }
                return b.status === histBannerStatusFilter
            })
    }, [
        bannerHistory,
        currentBannerBatch,
        histBannerCategoryFilter,
        histBannerFormatFilter,
        histBannerStatusFilter,
    ])

    /* ─── ESC closes lightbox ─── */
    useEffect(() => {
        if (!lightboxUrl) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxUrl(null)
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [lightboxUrl])

    /* ─── Polling unificado de imágenes ───
       Polling siempre activo (no condicional). En cada tick combina
       pending IDs de currentBatch + history y los pollea al RPC
       get_vtli_posts_by_ids. Cuando una imagen llega, actualiza ambos
       states in-place. Sobrevive a recargas de página porque al
       hidratar history desde DB se detectan los pending huérfanos
       automáticamente. Solo dispara toast "materializados" cuando
       transitamos de N>0 pending a 0 pending.

       v1.5: AUTO-RETRY INTELIGENTE. Cuando el polling detecta que un
       card lleva más de 3 min sin imagen + no rejected + no auto-
       reintentado todavía, dispara handleRetryImage() automático.
       Cubre el caso del waitUntil de Supabase Edge muriéndose cuando
       una imagen tarda >60s en el batch original. Cada auto-retry es
       una invocación FRESCA del worker con su propio waitUntil, casi
       siempre completa. Si el auto-retry también queda atascado otros
       3 min, recién ahí aparece el botón manual. Set en ref para que
       solo se dispare UNA vez por card sin re-renderear. */
    const currentBatchRef = useRef(currentBatch)
    const historyRef = useRef(history)
    // v1.6: Map<postId, retryCount> en lugar de Set<postId>. Cada card puede
    // auto-reintentar hasta MAX_AUTO_RETRIES veces consecutivas. Cuando se
    // agota el cupo, la card pasa a estado "Atascado" y muestra botón manual.
    const autoRetriedRef = useRef<Map<string, number>>(new Map())
    // v1.7: refs paralelas para el Atelier de Video. El polling sweepea
    // ambos universos (image + video) en cada tick.
    const currentVideoBatchRef = useRef(currentVideoBatch)
    const historyVideoRef = useRef(historyVideo)
    const autoRetriedVideoRef = useRef<Map<string, number>>(new Map())
    // v1.15: refs paralelas para el universo de Banners (3er sweep).
    const currentBannerBatchRef = useRef(currentBannerBatch)
    const bannerHistoryRef = useRef(bannerHistory)
    const autoRetriedBannerRef = useRef<Map<string, number>>(new Map())
    // v1.6: dummy tick para forzar re-render del padre cuando el polling
    // incrementa el contador de auto-retries en el ref. Sin esto, PostCard no
    // se entera del nuevo count (porque el ref no triggera re-render).
    const [retryTick, setRetryTick] = useState(0)
    useEffect(() => {
        currentBatchRef.current = currentBatch
    }, [currentBatch])
    useEffect(() => {
        historyRef.current = history
    }, [history])
    useEffect(() => {
        currentVideoBatchRef.current = currentVideoBatch
    }, [currentVideoBatch])
    useEffect(() => {
        historyVideoRef.current = historyVideo
    }, [historyVideo])
    useEffect(() => {
        currentBannerBatchRef.current = currentBannerBatch
    }, [currentBannerBatch])
    useEffect(() => {
        bannerHistoryRef.current = bannerHistory
    }, [bannerHistory])

    useEffect(() => {
        if (!userId) return
        let stopped = false
        let hadPending = false
        let lastAnnouncedAt = 0

        const tick = async () => {
            if (stopped) return
            // v1.9 FIX: calcular pending de imágenes Y videos en paralelo.
            // Early return solo si AMBOS universos están vacíos. Antes el
            // tick devolvía cuando no había imágenes pending y nunca llegaba
            // al sweep de videos.

            // Pending de imágenes (los manuales NO se sondean: su imagen la
            // sube Zak a mano, nunca llega por background).
            const pendingSet = new Set<string>()
            for (const p of currentBatchRef.current) {
                if (
                    !p.image_r2_url &&
                    p.status !== "rejected" &&
                    p.image_mode !== "prompts"
                ) {
                    pendingSet.add(p.id)
                }
            }
            for (const p of historyRef.current) {
                if (
                    !p.image_r2_url &&
                    p.status !== "rejected" &&
                    p.image_mode !== "prompts"
                ) {
                    pendingSet.add(p.id)
                }
            }
            const pendingIds = Array.from(pendingSet)

            // Pending de videos (calculado acá para el early return — el
            // sweep completo de videos sigue al final del tick)
            const pendingVideoEarlySet = new Set<string>()
            for (const v of currentVideoBatchRef.current) {
                if (!v.video_r2_url && v.status !== "rejected") {
                    pendingVideoEarlySet.add(v.id)
                }
            }
            for (const v of historyVideoRef.current) {
                if (!v.video_r2_url && v.status !== "rejected") {
                    pendingVideoEarlySet.add(v.id)
                }
            }

            // v1.15: pending de banners (3er universo del polling)
            const pendingBannerEarlySet = new Set<string>()
            for (const b of currentBannerBatchRef.current) {
                if (!b.image_r2_url && b.status !== "rejected") {
                    pendingBannerEarlySet.add(b.id)
                }
            }
            for (const b of bannerHistoryRef.current) {
                if (!b.image_r2_url && b.status !== "rejected") {
                    pendingBannerEarlySet.add(b.id)
                }
            }

            if (
                pendingIds.length === 0 &&
                pendingVideoEarlySet.size === 0 &&
                pendingBannerEarlySet.size === 0
            ) {
                if (hadPending && Date.now() - lastAnnouncedAt > 8000) {
                    lastAnnouncedAt = Date.now()
                    showToast("Fragmentos materializados")
                    loadDashboard()
                    loadDashboardVideo()
                    loadBannersDashboard()
                    hadPending = false
                }
                return
            }
            hadPending = true

            // Sweep de imágenes (solo si hay pending de imágenes)
            if (pendingIds.length > 0) try {
                const r = await rpc(
                    supabaseUrl,
                    supabaseAnonKey,
                    "get_vtli_posts_by_ids",
                    {
                        p_admin_clerk_id: userId,
                        p_ids: pendingIds,
                    }
                )
                if (r?.posts && Array.isArray(r.posts)) {
                    const map = new Map<string, any>()
                    for (const u of r.posts) {
                        if (u?.id) map.set(u.id, u)
                    }
                    const merger = (prev: VtliPost[]) =>
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

                // v1.6: AUTO-RETRY MÚLTIPLE sweep. Cards pending sin
                // imagen + no rejected + auto-retries no agotados disparan
                // una invocación fresca a generate-vtli-posts en modo
                // retry_image_only. Threshold corto (90s) + hasta
                // MAX_AUTO_RETRIES (5) reintentos por card. Cubre el
                // waitUntil dying del batch original Y los casos donde
                // el primer auto-retry también muere por saturación.
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
                    const currentRetries =
                        autoRetriedRef.current.get(p.id) ?? 0
                    // Cupo agotado → ya no auto-retry. PostCard detecta
                    // autoRetriesExhausted y muestra botón manual.
                    if (currentRetries >= MAX_AUTO_RETRIES) continue
                    const ageSec =
                        (now - new Date(p.generated_at).getTime()) /
                        1000
                    if (ageSec <= AUTO_RETRY_THRESHOLD_SEC) continue
                    const nextRetry = currentRetries + 1
                    autoRetriedRef.current.set(p.id, nextRetry)
                    autoRetriedCount++
                    console.log(
                        `[atelier:auto-retry] #${nextRetry}/${MAX_AUTO_RETRIES} firing for ${p.id} (age ${ageSec.toFixed(0)}s)`
                    )
                    // Reset visual optimista (mismo patrón que handleRetryImage)
                    const nowIso = new Date().toISOString()
                    const resetter = (prev: VtliPost[]) =>
                        prev.map((q) =>
                            q.id === p.id
                                ? {
                                      ...q,
                                      image_r2_url: null,
                                      status: "draft" as VtliStatus,
                                      generated_at: nowIso,
                                  }
                                : q
                        )
                    setCurrentBatch(resetter)
                    setHistory(resetter)
                    // Fire-and-forget POST al backend
                    fetch(
                        `${supabaseUrl}/functions/v1/generate-vtli-posts`,
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
                    ).catch((err) => {
                        console.warn(
                            "[atelier:auto-retry] dispatch failed",
                            err
                        )
                    })
                }
                if (autoRetriedCount > 0) {
                    // Forzamos re-render del padre para que PostCard reciba
                    // los nuevos counts via prop.
                    setRetryTick((n) => n + 1)
                    showToast(
                        `Reintentando ${autoRetriedCount} imagen${autoRetriedCount > 1 ? "es" : ""} automáticamente`
                    )
                }
            } catch (err) {
                console.warn("[atelier:poll]", err)
            }

            // ─── v1.7: SWEEP DE VIDEOS (paralelo al de imágenes) ───
            const pendingVideoSet = new Set<string>()
            for (const v of currentVideoBatchRef.current) {
                if (!v.video_r2_url && v.status !== "rejected") {
                    pendingVideoSet.add(v.id)
                }
            }
            for (const v of historyVideoRef.current) {
                if (!v.video_r2_url && v.status !== "rejected") {
                    pendingVideoSet.add(v.id)
                }
            }
            const pendingVideoIds = Array.from(pendingVideoSet)

            if (pendingVideoIds.length > 0) {
                try {
                    const rv = await rpc(
                        supabaseUrl,
                        supabaseAnonKey,
                        "get_vtli_videos_by_ids",
                        {
                            p_admin_clerk_id: userId,
                            p_ids: pendingVideoIds,
                        }
                    )
                    if (rv?.videos && Array.isArray(rv.videos)) {
                        const vmap = new Map<string, any>()
                        for (const u of rv.videos) {
                            if (u?.id) vmap.set(u.id, u)
                        }
                        const vmerger = (prev: VtliVideo[]) =>
                            prev.map((v) => {
                                const u = vmap.get(v.id)
                                if (!u) return v
                                if (
                                    u.video_r2_url ||
                                    u.status === "rejected"
                                ) {
                                    return {
                                        ...v,
                                        video_r2_url: u.video_r2_url,
                                        status: u.status,
                                        replicate_prediction_id:
                                            u.replicate_prediction_id,
                                    }
                                }
                                return v
                            })
                        setCurrentVideoBatch(vmerger)
                        setHistoryVideo(vmerger)
                    }

                    // v1.10: NO AUTO-RETRY para videos ($3.03 USD/intento).
                    // El sweep de polling de arriba detecta la finalización de
                    // fal.ai sin disparar nada automático. Si después de
                    // VIDEO_STUCK_THRESHOLD_SEC (5 min) el card sigue sin
                    // video_r2_url, VideoCard muestra "↻ Reintentar video"
                    // manual. Zak decide consciente cuando gastar otros $3.
                } catch (err) {
                    console.warn("[atelier-video:poll]", err)
                }
            }

            // ─── v1.15: SWEEP DE BANNERS (3er universo, paralelo) ───
            const pendingBannerSet = new Set<string>()
            for (const b of currentBannerBatchRef.current) {
                if (!b.image_r2_url && b.status !== "rejected") {
                    pendingBannerSet.add(b.id)
                }
            }
            for (const b of bannerHistoryRef.current) {
                if (!b.image_r2_url && b.status !== "rejected") {
                    pendingBannerSet.add(b.id)
                }
            }
            const pendingBannerIds = Array.from(pendingBannerSet)

            if (pendingBannerIds.length > 0) {
                try {
                    const rb = await rpc(
                        supabaseUrl,
                        supabaseAnonKey,
                        "get_vtli_banners_by_ids",
                        {
                            p_admin_clerk_id: userId,
                            p_banner_ids: pendingBannerIds,
                        }
                    )
                    if (rb?.banners && Array.isArray(rb.banners)) {
                        const bmap = new Map<string, any>()
                        for (const u of rb.banners) {
                            if (u?.id) bmap.set(u.id, u)
                        }
                        const bmerger = (prev: VtliBanner[]) =>
                            prev.map((b) => {
                                const u = bmap.get(b.id)
                                if (!u) return b
                                if (
                                    u.image_r2_url ||
                                    u.status === "rejected"
                                ) {
                                    return {
                                        ...b,
                                        image_r2_url: u.image_r2_url,
                                        status: u.status,
                                    }
                                }
                                return b
                            })
                        setCurrentBannerBatch(bmerger)
                        setBannerHistory(bmerger)
                    }

                    // Auto-retry para imágenes de banners (mismo patrón que
                    // posts orgánicos — cada imagen cuesta ~$0.067 USD, el
                    // cupo de 5 retries × 3 banners = $1 USD worst case por
                    // concepto, absorbible).
                    const allBanners = [
                        ...currentBannerBatchRef.current,
                        ...bannerHistoryRef.current,
                    ]
                    const now = Date.now()
                    let autoRetriedBannerCount = 0
                    const seenB = new Set<string>()
                    for (const b of allBanners) {
                        if (seenB.has(b.id)) continue
                        seenB.add(b.id)
                        if (b.image_r2_url || b.status === "rejected") continue
                        const currentRetries =
                            autoRetriedBannerRef.current.get(b.id) ?? 0
                        if (currentRetries >= MAX_AUTO_RETRIES) continue
                        const ageSec =
                            (now - new Date(b.generated_at).getTime()) /
                            1000
                        if (ageSec <= AUTO_RETRY_THRESHOLD_SEC) continue
                        const nextRetry = currentRetries + 1
                        autoRetriedBannerRef.current.set(b.id, nextRetry)
                        autoRetriedBannerCount++
                        console.log(
                            `[banners:auto-retry] #${nextRetry}/${MAX_AUTO_RETRIES} firing for ${b.id} (age ${ageSec.toFixed(0)}s)`
                        )
                        const nowIso = new Date().toISOString()
                        const bresetter = (prev: VtliBanner[]) =>
                            prev.map((q) =>
                                q.id === b.id
                                    ? {
                                          ...q,
                                          image_r2_url: null,
                                          status: "draft" as VtliBannerStatus,
                                          generated_at: nowIso,
                                      }
                                    : q
                            )
                        setCurrentBannerBatch(bresetter)
                        setBannerHistory(bresetter)
                        fetch(
                            `${supabaseUrl}/functions/v1/generate-vtli-banners`,
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
                                    retry_image_only_for_banner_id: b.id,
                                }),
                            }
                        ).catch((err) => {
                            console.warn(
                                "[banners:auto-retry] dispatch failed",
                                err
                            )
                        })
                    }
                    if (autoRetriedBannerCount > 0) {
                        setRetryTick((n) => n + 1)
                        showToast(
                            `Reintentando ${autoRetriedBannerCount} banner${autoRetriedBannerCount > 1 ? "s" : ""} automáticamente`
                        )
                    }
                } catch (err) {
                    console.warn("[banners:poll]", err)
                }
            }
        }

        const interval = setInterval(tick, 4000)
        return () => {
            stopped = true
            clearInterval(interval)
        }
    }, [
        userId,
        supabaseUrl,
        supabaseAnonKey,
        loadDashboard,
        loadDashboardVideo,
        loadBannersDashboard,
        showToast,
    ])

    /* ─── Render: loading / unauthorized ─── */
    if (loading) {
        return (
            <div
                className="at-wrap"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <p
                    style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color: "#fff",
                        letterSpacing: "0.1em",
                    }}
                >
                    Verificando acceso...
                </p>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div
                className="at-wrap"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <p
                    style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color: "rgba(255,100,100,0.55)",
                        letterSpacing: "0.1em",
                    }}
                >
                    Acceso denegado. Solo Arquitectos.
                </p>
            </div>
        )
    }

    /* ─── Render principal ─── */
    return (
        <div className="at-wrap">
            {/* Fondo "Amanecer Solar" — auroras cálidas que derivan lento (en
                vez del campo de estrellas oscuro). Capa fija detrás del contenido. */}
            <div className="at-cosmos-bg" aria-hidden="true">
                <div className="at-aurora a1" />
                <div className="at-aurora a2" />
                <div className="at-aurora a3" />
                <div className="at-aurora a4" />
                <div className="at-aurora a5" />
            </div>
            <NavRevealPin nav={(path: string) => (window.location.href = path)} />
            <h1 className="at-title">✦ Atelier de Marketing</h1>
            <p className="at-title-sub">Motor de generación visual VTLI</p>

            <div className="at-shell">
                {/* ─── Dashboard (colapsable) ─── */}
                {dashboard && (
                    <>
                        <button
                            type="button"
                            onClick={() => setShowStats((s) => !s)}
                            style={{
                                display: "block",
                                margin: "0 auto 14px",
                                padding: "9px 20px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 10,
                                color: "rgba(255,255,255,0.78)",
                                fontSize: 11,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            {showStats ? "▾ " : "▸ "}Número de posts emitidos
                        </button>
                        {showStats && (
                    <div className="at-dashboard">
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.month_generated_veo}
                            </p>
                            <p className="at-stat-lbl">VEO mes</p>
                        </div>
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.month_generated_telekinesis}
                            </p>
                            <p className="at-stat-lbl">Telekinesis mes</p>
                        </div>
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.month_generated_calibracion ?? 0}
                            </p>
                            <p className="at-stat-lbl">Calibración mes</p>
                        </div>
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.month_generated_sintonia ?? 0}
                            </p>
                            <p className="at-stat-lbl">Sintonía mes</p>
                        </div>
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.month_approved}
                            </p>
                            <p className="at-stat-lbl">Aprobados mes</p>
                        </div>
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.month_published}
                            </p>
                            <p className="at-stat-lbl">Publicados mes</p>
                        </div>
                        <div className="at-stat">
                            <p className="at-stat-num">
                                {dashboard.total_lifetime}
                            </p>
                            <p className="at-stat-lbl">Total histórico</p>
                        </div>
                    </div>
                        )}
                    </>
                )}

                {/* ─── Sub-tabs (v1.15: VTLI Banners + VEO/ZakHaar Video activos) ─── */}
                <div className="at-subtabs">
                    <button
                        className={`at-subtab ${activeSubTab === "veo_instagram" ? "active" : ""}`}
                        onClick={() => setActiveSubTab("veo_instagram")}
                        title="Posts orgánicos Instagram para los 4 pilares VTLI"
                    >
                        VTLI Instagram
                    </button>
                    <button
                        className={`at-subtab ${activeSubTab === "vtli_banners" ? "active" : ""}`}
                        onClick={() => setActiveSubTab("vtli_banners")}
                        title="Banners ad-ready para Meta Ads (Cancún geo-targeted)"
                    >
                        VTLI Banners
                    </button>
                    <button
                        className="at-subtab disabled"
                        disabled
                        title="Próximamente"
                    >
                        ZakHaar Instagram
                    </button>
                    <button
                        className={`at-subtab ${activeSubTab === "veo_video" ? "active" : ""}`}
                        onClick={() => setActiveSubTab("veo_video")}
                        title="Reels VTLI · Seedance 2.0 720p 9:16 (los 4 pilares)"
                    >
                        VTLI Video
                    </button>
                    <button
                        className={`at-subtab ${activeSubTab === "estudio_manual" ? "active" : ""}`}
                        onClick={() => setActiveSubTab("estudio_manual")}
                        title="Storyboards de keyframes para animar en Grok (40-60s · misma cara)"
                    >
                        Zak'Haar Video
                    </button>
                    <button
                        className={`at-subtab ${activeSubTab === "zakhaar_posts" ? "active" : ""}`}
                        onClick={() => setActiveSubTab("zakhaar_posts")}
                        title="Carruseles de Zak'Haar (próximamente)"
                    >
                        Zak'Haar Posts
                    </button>
                    <button
                        className={`at-subtab ${activeSubTab === "soma_cero" ? "active" : ""}`}
                        onClick={() => setActiveSubTab("soma_cero")}
                        title="Posts de Instagram de Soma Cero (alimentos de alta conductividad · Cancún)"
                    >
                        Soma Cero
                    </button>
                </div>

                {/* ─── Error global ─── */}
                {errorMsg && (
                    <div className="at-error">{errorMsg}</div>
                )}

                {/* ─── Sub-tab activo: Estudio Manual (storyboards Grok) ─── */}
                {activeSubTab === "estudio_manual" && (
                    <AtelierEstudioManual
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkUserId={userId}
                        isMobile={isMobile}
                    />
                )}

                {/* ─── Sub-tab activo: Soma Cero (posts Instagram de alimentos) ─── */}
                {activeSubTab === "soma_cero" && (
                    <AtelierSomaCero
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkUserId={userId}
                        isMobile={isMobile}
                    />
                )}

                {/* ─── Sub-tab activo: Zak'Haar Posts (carruseles · próximamente) ─── */}
                {activeSubTab === "zakhaar_posts" && (
                    <AtelierZakHaarCarrusel
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkUserId={userId}
                        isMobile={isMobile}
                    />
                )}

                {/* ─── Sub-tab activo: VEO Instagram ─── */}
                {activeSubTab === "veo_instagram" && (
                    <>
                        <div className="at-mode-toggle">
                            <span className="at-mode-label">Imágenes:</span>
                            <button
                                className={`at-mode-btn ${imageMode === "prompts" ? "on" : ""}`}
                                onClick={() => setImageMode("prompts")}
                                disabled={!!generating}
                                title="El motor solo te da el prompt; la imagen la generas a mano en Nano Banana (plan Pro). Costo $0."
                            >
                                Solo prompts
                            </button>
                            <button
                                className={`at-mode-btn ${imageMode === "api" ? "on" : ""}`}
                                onClick={() => setImageMode("api")}
                                disabled={!!generating}
                                title="El motor genera las imágenes por API (tiene costo por imagen)."
                            >
                                Con API
                            </button>
                            {imageMode === "prompts" && (
                                <span className="at-mode-hint">
                                    El mismo prompt que iría a la API — lo pegas
                                    a mano en Nano Banana y subes la imagen al
                                    card. Sin cambios en cómo salen.
                                </span>
                            )}
                        </div>
                        <div className="at-gen-buttons">
                            <button
                                className={`at-gen-btn ${generating === "veo" ? "busy" : ""}`}
                                onClick={() => handleGenerate("veo")}
                                disabled={!!generating}
                            >
                                <span className="at-gen-glyph">◈</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generating === "veo"
                                            ? "Materializando " + postCount + " VEO…"
                                            : "Generar " + postCount + " VEO"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Visión Extra Ocular · 40-70s
                                    </span>
                                </span>
                            </button>
                            <button
                                className={`at-gen-btn ${generating === "telekinesis" ? "busy" : ""}`}
                                onClick={() => handleGenerate("telekinesis")}
                                disabled={!!generating}
                            >
                                <span className="at-gen-glyph">◇</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generating === "telekinesis"
                                            ? "Materializando " + postCount + " Telekinesis…"
                                            : "Generar " + postCount + " Telekinesis"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Resonancia de fase · 40-70s
                                    </span>
                                </span>
                            </button>
                            <button
                                className={`at-gen-btn ${generating === "calibracion" ? "busy" : ""}`}
                                onClick={() => handleGenerate("calibracion")}
                                disabled={!!generating}
                            >
                                <span className="at-gen-glyph">⬡</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generating === "calibracion"
                                            ? "Materializando " + postCount + " Calibración…"
                                            : "Generar " + postCount + " Calibración"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Calibración Biológica · 40-70s
                                    </span>
                                </span>
                            </button>
                            <button
                                className={`at-gen-btn ${generating === "sintonia" ? "busy" : ""}`}
                                onClick={() => handleGenerate("sintonia")}
                                disabled={!!generating}
                            >
                                <span className="at-gen-glyph">⬢</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generating === "sintonia"
                                            ? "Materializando " + postCount + " Sintonía…"
                                            : "Generar " + postCount + " Sintonía"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Sintonía de Núcleo · 40-70s
                                    </span>
                                </span>
                            </button>
                        </div>

                        {/* ─── Batch actual ─── */}
                        {currentBatch.length > 0 && (
                            <>
                                <div className="at-batch-header">
                                    <p className="at-batch-title">
                                        Tanda actual ({currentBatch.length} posts)
                                    </p>
                                    <span className="at-batch-meta">
                                        Aprueba / reroll / descarga cada fragmento. Los aprobados alimentan la memoria anti-repetición.
                                    </span>
                                </div>
                                <div className="at-grid">
                                    {currentBatch.map((post) => {
                                        const retryCount =
                                            autoRetriedRef.current.get(
                                                post.id
                                            ) ?? 0
                                        return (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                isProcessing={
                                                    processingPostId === post.id
                                                }
                                                autoRetryCount={retryCount}
                                                autoRetriesExhausted={
                                                    retryCount >=
                                                    MAX_AUTO_RETRIES
                                                }
                                                onApprove={() =>
                                                    handleUpdateStatus(
                                                        post.id,
                                                        "approved"
                                                    )
                                                }
                                                onPublish={() =>
                                                    handleUpdateStatus(
                                                        post.id,
                                                        "published"
                                                    )
                                                }
                                                onReject={() =>
                                                    handleUpdateStatus(
                                                        post.id,
                                                        "rejected"
                                                    )
                                                }
                                                onReroll={() =>
                                                    handleReroll(post.id)
                                                }
                                                onDownload={() =>
                                                    handleDownload(post)
                                                }
                                                onCopy={() => handleCopy(post)}
                                                onDelete={() =>
                                                    handleDelete(post)
                                                }
                                                onRetryImage={() =>
                                                    handleRetryImage(post.id)
                                                }
                                                onZoom={(url) =>
                                                    setLightboxUrl(url)
                                                }
                                                onUploadImage={(file) =>
                                                    handleUploadPostImage(
                                                        post.id,
                                                        file
                                                    )
                                                }
                                                onCopyPrompt={() =>
                                                    handleCopyPrompt(post)
                                                }
                                                onTogglePublished={() =>
                                                    handleTogglePublished(post)
                                                }
                                                uploading={
                                                    uploadingPostId === post.id
                                                }
                                            />
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {/* ─── Empty state cuando aún no se ha generado ─── */}
                        {currentBatch.length === 0 && !generating && (
                            <div className="at-empty">
                                Sin tanda activa. Pica un botón arriba para
                                materializar 3 fragmentos. Si quieres más,
                                vuelve a picar.
                            </div>
                        )}

                        {/* ─── Historial ─── */}
                        <div className="at-section-header">
                            <span>Historial</span>
                            <span className="at-section-header-count">
                                {filteredHistory.length} posts
                            </span>
                        </div>

                        <div className="at-history-filters">
                            <button
                                className={`at-filter ${histCategoryFilter === "all" ? "active" : ""}`}
                                onClick={() => setHistCategoryFilter("all")}
                            >
                                Todas
                            </button>
                            <button
                                className={`at-filter ${histCategoryFilter === "veo" ? "active" : ""}`}
                                onClick={() => setHistCategoryFilter("veo")}
                            >
                                VEO
                            </button>
                            <button
                                className={`at-filter ${histCategoryFilter === "telekinesis" ? "active" : ""}`}
                                onClick={() => setHistCategoryFilter("telekinesis")}
                            >
                                Telekinesis
                            </button>
                            <button
                                className={`at-filter ${histCategoryFilter === "calibracion" ? "active" : ""}`}
                                onClick={() => setHistCategoryFilter("calibracion")}
                            >
                                Calibración
                            </button>
                            <button
                                className={`at-filter ${histCategoryFilter === "sintonia" ? "active" : ""}`}
                                onClick={() => setHistCategoryFilter("sintonia")}
                            >
                                Sintonía
                            </button>
                            <span style={{ flex: 1 }} />
                            <button
                                className={`at-filter ${histStatusFilter === "all" ? "active" : ""}`}
                                onClick={() => setHistStatusFilter("all")}
                            >
                                Todos estados
                            </button>
                            <button
                                className={`at-filter ${histStatusFilter === "approved" ? "active" : ""}`}
                                onClick={() => setHistStatusFilter("approved")}
                            >
                                Aprobados
                            </button>
                            <button
                                className={`at-filter ${histStatusFilter === "published" ? "active" : ""}`}
                                onClick={() => setHistStatusFilter("published")}
                            >
                                Publicados
                            </button>
                            <button
                                className={`at-filter ${histStatusFilter === "draft" ? "active" : ""}`}
                                onClick={() => setHistStatusFilter("draft")}
                            >
                                Borrador
                            </button>
                            <button
                                className={`at-filter ${histStatusFilter === "incomplete" ? "active" : ""}`}
                                onClick={() =>
                                    setHistStatusFilter("incomplete")
                                }
                                title="Posts atascados sin imagen + posts marcados como rechazados (por fallo de imagen u otra razón)"
                            >
                                Incompletos
                            </button>
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="at-empty">
                                Sin historial bajo estos filtros.
                            </div>
                        ) : (
                            <div className="at-grid">
                                {filteredHistory.slice(0, 60).map((post) => {
                                    const retryCount =
                                        autoRetriedRef.current.get(
                                            post.id
                                        ) ?? 0
                                    return (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            isProcessing={
                                                processingPostId === post.id
                                            }
                                            autoRetryCount={retryCount}
                                            autoRetriesExhausted={
                                                retryCount >=
                                                MAX_AUTO_RETRIES
                                            }
                                            onApprove={() =>
                                                handleUpdateStatus(
                                                    post.id,
                                                    "approved"
                                                )
                                            }
                                            onPublish={() =>
                                                handleUpdateStatus(
                                                    post.id,
                                                    "published"
                                                )
                                            }
                                            onReject={() =>
                                                handleUpdateStatus(
                                                    post.id,
                                                    "rejected"
                                                )
                                            }
                                            onReroll={() =>
                                                handleReroll(post.id)
                                            }
                                            onDownload={() =>
                                                handleDownload(post)
                                            }
                                            onCopy={() => handleCopy(post)}
                                            onDelete={() => handleDelete(post)}
                                            onRetryImage={() =>
                                                handleRetryImage(post.id)
                                            }
                                            onZoom={(url) =>
                                                setLightboxUrl(url)
                                            }
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ─── v1.15: Sub-tab activo: VTLI Banners ─── */}
                {activeSubTab === "vtli_banners" && (
                    <>
                        {/* Dashboard banners — 6 stats (4 pilares + 2 formatos) */}
                        {bannersDashboard && (
                            <div
                                className="at-dashboard"
                                style={{ marginTop: 12 }}
                            >
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            bannersDashboard.month_generated_veo
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        VEO banners mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            bannersDashboard.month_generated_telekinesis
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Telekinesis banners mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            bannersDashboard.month_generated_calibracion
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Calibración banners mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            bannersDashboard.month_generated_sintonia
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Sintonía banners mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            bannersDashboard.month_generated_feed_portrait
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Feed 4:5 mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            bannersDashboard.month_generated_stories
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Stories 9:16 mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {bannersDashboard.total_lifetime}
                                    </p>
                                    <p className="at-stat-lbl">
                                        Total histórico
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 4 botones de generación (uno por pilar, grid 2×2) */}
                        <div className="at-gen-buttons">
                            <button
                                className={`at-gen-btn ${generatingBanner === "veo" ? "busy" : ""}`}
                                onClick={() => handleGenerateBanner("veo")}
                                disabled={!!generatingBanner}
                            >
                                <span className="at-gen-glyph">◈</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generatingBanner === "veo"
                                            ? "Materializando 2 banners VEO…"
                                            : "Banner VEO (feed + stories)"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Visión Extra Ocular · ~$0.13 USD
                                    </span>
                                </span>
                            </button>
                            <button
                                className={`at-gen-btn ${generatingBanner === "telekinesis" ? "busy" : ""}`}
                                onClick={() =>
                                    handleGenerateBanner("telekinesis")
                                }
                                disabled={!!generatingBanner}
                            >
                                <span className="at-gen-glyph">◇</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generatingBanner === "telekinesis"
                                            ? "Materializando 2 banners Telekinesis…"
                                            : "Banner Telekinesis (feed + stories)"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Resonancia de fase · ~$0.13 USD
                                    </span>
                                </span>
                            </button>
                            <button
                                className={`at-gen-btn ${generatingBanner === "calibracion" ? "busy" : ""}`}
                                onClick={() =>
                                    handleGenerateBanner("calibracion")
                                }
                                disabled={!!generatingBanner}
                            >
                                <span className="at-gen-glyph">⬡</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generatingBanner === "calibracion"
                                            ? "Materializando 2 banners Calibración…"
                                            : "Banner Calibración (feed + stories)"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Calibración Biológica · ~$0.13 USD
                                    </span>
                                </span>
                            </button>
                            <button
                                className={`at-gen-btn ${generatingBanner === "sintonia" ? "busy" : ""}`}
                                onClick={() =>
                                    handleGenerateBanner("sintonia")
                                }
                                disabled={!!generatingBanner}
                            >
                                <span className="at-gen-glyph">⬢</span>
                                <span className="at-gen-text">
                                    <span className="at-gen-main">
                                        {generatingBanner === "sintonia"
                                            ? "Materializando 2 banners Sintonía…"
                                            : "Banner Sintonía (feed + stories)"}
                                    </span>
                                    <span className="at-gen-sub">
                                        Sintonía de Núcleo · ~$0.13 USD
                                    </span>
                                </span>
                            </button>
                        </div>

                        {/* Concepto actual (heading + grid 3-up) */}
                        {currentBannerBatch.length > 0 && (
                            <>
                                <div className="at-banner-concept-header">
                                    <p className="at-banner-concept-target">
                                        Concepto actual ·{" "}
                                        {currentBannerBatch[0].category} ·{" "}
                                        Target:{" "}
                                        {currentBannerBatch[0].target}
                                    </p>
                                    <p className="at-banner-concept-hook">
                                        {currentBannerBatch[0].hook}
                                    </p>
                                    {currentBannerBatch[0].pulso_nucleo && (
                                        <p className="at-banner-concept-pulso">
                                            {
                                                currentBannerBatch[0]
                                                    .pulso_nucleo
                                            }
                                        </p>
                                    )}
                                    <div className="at-banner-concept-actions">
                                        <button
                                            className="at-banner-concept-action"
                                            onClick={() =>
                                                handleRerollBannerConcept(
                                                    currentBannerBatch[0]
                                                )
                                            }
                                            disabled={
                                                !!processingBannerId ||
                                                !!generatingBanner
                                            }
                                            title="Regenerar el CONCEPTO COMPLETO (nuevo hook, target, pulso + 2 banners nuevos con nuevo concept_id). Los 2 actuales se marcan como rerolled. Costo: ~$0.13 USD."
                                        >
                                            ↻ Reroll concepto completo (2
                                            banners nuevos)
                                        </button>
                                    </div>
                                </div>
                                <div className="at-grid">
                                    {currentBannerBatch.map((banner) => {
                                        const retryCount =
                                            autoRetriedBannerRef.current.get(
                                                banner.id
                                            ) ?? 0
                                        return (
                                            <BannerCard
                                                key={banner.id}
                                                banner={banner}
                                                isProcessing={
                                                    processingBannerId ===
                                                    banner.id
                                                }
                                                autoRetryCount={retryCount}
                                                autoRetriesExhausted={
                                                    retryCount >=
                                                    MAX_AUTO_RETRIES
                                                }
                                                onApprove={() =>
                                                    handleUpdateBannerStatus(
                                                        banner.id,
                                                        "approved"
                                                    )
                                                }
                                                onPublish={() =>
                                                    handleUpdateBannerStatus(
                                                        banner.id,
                                                        "published"
                                                    )
                                                }
                                                onRerollFormat={() =>
                                                    handleRerollBannerFormat(
                                                        banner
                                                    )
                                                }
                                                onDownload={() =>
                                                    handleDownloadBanner(
                                                        banner
                                                    )
                                                }
                                                onCopySpecs={() =>
                                                    handleCopyBannerSpecs(
                                                        banner
                                                    )
                                                }
                                                onDelete={() =>
                                                    handleDeleteBanner(
                                                        banner
                                                    )
                                                }
                                                onRetryImage={() =>
                                                    handleRetryBannerImage(
                                                        banner.id
                                                    )
                                                }
                                                onZoom={(url) =>
                                                    setLightboxUrl(url)
                                                }
                                                onUploadImage={(file) =>
                                                    handleUploadPostImage(
                                                        post.id,
                                                        file
                                                    )
                                                }
                                                onCopyPrompt={() =>
                                                    handleCopyPrompt(post)
                                                }
                                                onTogglePublished={() =>
                                                    handleTogglePublished(post)
                                                }
                                                uploading={
                                                    uploadingPostId === post.id
                                                }
                                            />
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {currentBannerBatch.length === 0 &&
                            !generatingBanner && (
                                <div className="at-empty">
                                    Sin concepto activo. Pica uno de los 4
                                    botones arriba para materializar UN
                                    concepto creativo en los 2 formatos
                                    Instagram (feed 4:5 + stories 9:16).
                                </div>
                            )}

                        {/* Historial */}
                        <div className="at-section-header">
                            <span>Banners históricos</span>
                            <span className="at-section-header-count">
                                {filteredBannerHistory.length} banners
                            </span>
                        </div>

                        <div className="at-history-filters">
                            <button
                                className={`at-filter ${histBannerCategoryFilter === "all" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerCategoryFilter("all")
                                }
                            >
                                Todos pilares
                            </button>
                            <button
                                className={`at-filter ${histBannerCategoryFilter === "veo" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerCategoryFilter("veo")
                                }
                            >
                                VEO
                            </button>
                            <button
                                className={`at-filter ${histBannerCategoryFilter === "telekinesis" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerCategoryFilter(
                                        "telekinesis"
                                    )
                                }
                            >
                                Telekinesis
                            </button>
                            <button
                                className={`at-filter ${histBannerCategoryFilter === "calibracion" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerCategoryFilter(
                                        "calibracion"
                                    )
                                }
                            >
                                Calibración
                            </button>
                            <button
                                className={`at-filter ${histBannerCategoryFilter === "sintonia" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerCategoryFilter("sintonia")
                                }
                            >
                                Sintonía
                            </button>
                        </div>

                        <div
                            className="at-history-filters"
                            style={{ marginTop: -8 }}
                        >
                            <button
                                className={`at-filter ${histBannerFormatFilter === "all" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerFormatFilter("all")
                                }
                            >
                                Todos formatos
                            </button>
                            <button
                                className={`at-filter ${histBannerFormatFilter === "feed_portrait" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerFormatFilter(
                                        "feed_portrait"
                                    )
                                }
                            >
                                Feed 4:5
                            </button>
                            <button
                                className={`at-filter ${histBannerFormatFilter === "stories_9x16" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerFormatFilter(
                                        "stories_9x16"
                                    )
                                }
                            >
                                Stories 9:16
                            </button>
                            <span style={{ flex: 1 }} />
                            <button
                                className={`at-filter ${histBannerStatusFilter === "all" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerStatusFilter("all")
                                }
                            >
                                Todos estados
                            </button>
                            <button
                                className={`at-filter ${histBannerStatusFilter === "approved" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerStatusFilter("approved")
                                }
                            >
                                Aprobados
                            </button>
                            <button
                                className={`at-filter ${histBannerStatusFilter === "published" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerStatusFilter("published")
                                }
                            >
                                Exportados
                            </button>
                            <button
                                className={`at-filter ${histBannerStatusFilter === "draft" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerStatusFilter("draft")
                                }
                            >
                                Borrador
                            </button>
                            <button
                                className={`at-filter ${histBannerStatusFilter === "incomplete" ? "active" : ""}`}
                                onClick={() =>
                                    setHistBannerStatusFilter("incomplete")
                                }
                                title="Banners atascados sin imagen + rechazados"
                            >
                                Incompletos
                            </button>
                        </div>

                        {filteredBannerHistory.length === 0 ? (
                            <div className="at-empty">
                                Sin historial bajo estos filtros.
                            </div>
                        ) : (
                            <div className="at-grid">
                                {filteredBannerHistory
                                    .slice(0, 60)
                                    .map((banner) => {
                                        const retryCount =
                                            autoRetriedBannerRef.current.get(
                                                banner.id
                                            ) ?? 0
                                        return (
                                            <BannerCard
                                                key={banner.id}
                                                banner={banner}
                                                isProcessing={
                                                    processingBannerId ===
                                                    banner.id
                                                }
                                                autoRetryCount={retryCount}
                                                autoRetriesExhausted={
                                                    retryCount >=
                                                    MAX_AUTO_RETRIES
                                                }
                                                onApprove={() =>
                                                    handleUpdateBannerStatus(
                                                        banner.id,
                                                        "approved"
                                                    )
                                                }
                                                onPublish={() =>
                                                    handleUpdateBannerStatus(
                                                        banner.id,
                                                        "published"
                                                    )
                                                }
                                                onRerollFormat={() =>
                                                    handleRerollBannerFormat(
                                                        banner
                                                    )
                                                }
                                                onDownload={() =>
                                                    handleDownloadBanner(
                                                        banner
                                                    )
                                                }
                                                onCopySpecs={() =>
                                                    handleCopyBannerSpecs(
                                                        banner
                                                    )
                                                }
                                                onDelete={() =>
                                                    handleDeleteBanner(
                                                        banner
                                                    )
                                                }
                                                onRetryImage={() =>
                                                    handleRetryBannerImage(
                                                        banner.id
                                                    )
                                                }
                                                onZoom={(url) =>
                                                    setLightboxUrl(url)
                                                }
                                            />
                                        )
                                    })}
                            </div>
                        )}
                    </>
                )}

                {/* ─── v1.7: sub-tabs de VIDEO (VEO Video / ZakHaar Video) ─── */}
                {(activeSubTab === "veo_video" ||
                    activeSubTab === "zakhaar_video") && (
                    <>
                        {/* Dashboard de video (counters del mes) */}
                        {dashboardVideo && (
                            <div
                                className="at-dashboard"
                                style={{ marginTop: 12 }}
                            >
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            dashboardVideo.month_generated_veo_video
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        VTLI video mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            dashboardVideo.month_generated_zakhaar_video
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        ZakHaar video mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            dashboardVideo.month_approved_video
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Aprobados mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {
                                            dashboardVideo.month_published_video
                                        }
                                    </p>
                                    <p className="at-stat-lbl">
                                        Publicados mes
                                    </p>
                                </div>
                                <div className="at-stat">
                                    <p className="at-stat-num">
                                        {dashboardVideo.total_lifetime_video}
                                    </p>
                                    <p className="at-stat-lbl">
                                        Total histórico
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Botón UN solo de generación (no batch — ~$0.90 USD/video) */}
                        <div
                            className="at-gen-buttons"
                            style={{ gridTemplateColumns: "1fr" }}
                        >
                            {activeSubTab === "veo_video" && (
                                <button
                                    className={`at-gen-btn ${generatingVideo === "veo" ? "busy" : ""}`}
                                    onClick={() =>
                                        handleGenerateVideo("veo")
                                    }
                                    disabled={!!generatingVideo}
                                >
                                    <span className="at-gen-glyph">
                                        ◈
                                    </span>
                                    <span className="at-gen-text">
                                        <span className="at-gen-main">
                                            {generatingVideo === "veo"
                                                ? "Materializando 1 VTLI Video…"
                                                : "Generar 1 VTLI Video"}
                                        </span>
                                        <span className="at-gen-sub">
                                            Seedance 2.0 Standard · 720p
                                            9:16 · 10s · ~$3.03 USD ·
                                            60-120s
                                        </span>
                                    </span>
                                </button>
                            )}
                            {activeSubTab === "zakhaar_video" && (
                                <button
                                    className={`at-gen-btn ${generatingVideo === "zakhaar" ? "busy" : ""}`}
                                    onClick={() =>
                                        handleGenerateVideo("zakhaar")
                                    }
                                    disabled={!!generatingVideo}
                                >
                                    <span className="at-gen-glyph">
                                        ◇
                                    </span>
                                    <span className="at-gen-text">
                                        <span className="at-gen-main">
                                            {generatingVideo === "zakhaar"
                                                ? "Materializando 1 Zak'Haar Reel…"
                                                : "Generar 1 Zak'Haar Reel"}
                                        </span>
                                        <span className="at-gen-sub">
                                            Seedance 2.0 Standard · 720p
                                            9:16 · 10s · ~$3.03 USD ·
                                            60-120s
                                        </span>
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Batch actual (typically 1 video per sub-tab pick) */}
                        {currentVideoBatch.filter(
                            (v) =>
                                (activeSubTab === "veo_video" &&
                                    v.category === "veo") ||
                                (activeSubTab === "zakhaar_video" &&
                                    v.category === "zakhaar")
                        ).length > 0 && (
                            <>
                                <div className="at-batch-header">
                                    <p className="at-batch-title">
                                        Tanda actual
                                    </p>
                                    <span className="at-batch-meta">
                                        Aprobá / reroll / descargá el Reel.
                                        Los aprobados alimentan la memoria
                                        anti-repetición.
                                    </span>
                                </div>
                                <div className="at-grid">
                                    {currentVideoBatch
                                        .filter(
                                            (v) =>
                                                (activeSubTab ===
                                                    "veo_video" &&
                                                    v.category === "veo") ||
                                                (activeSubTab ===
                                                    "zakhaar_video" &&
                                                    v.category === "zakhaar")
                                        )
                                        .map((video) => {
                                            const retryCount =
                                                autoRetriedVideoRef.current.get(
                                                    video.id
                                                ) ?? 0
                                            return (
                                                <VideoCard
                                                    key={video.id}
                                                    video={video}
                                                    isProcessing={
                                                        processingVideoId ===
                                                        video.id
                                                    }
                                                    autoRetryCount={
                                                        retryCount
                                                    }
                                                    autoRetriesExhausted={
                                                        retryCount >=
                                                        MAX_AUTO_RETRIES
                                                    }
                                                    onApprove={() =>
                                                        handleUpdateVideoStatus(
                                                            video.id,
                                                            "approved"
                                                        )
                                                    }
                                                    onPublish={() =>
                                                        handleUpdateVideoStatus(
                                                            video.id,
                                                            "published"
                                                        )
                                                    }
                                                    onReroll={() =>
                                                        handleRerollVideo(
                                                            video.id
                                                        )
                                                    }
                                                    onDownload={() =>
                                                        handleDownloadVideo(
                                                            video
                                                        )
                                                    }
                                                    onCopy={() =>
                                                        handleCopyVideo(
                                                            video
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        handleDeleteVideo(
                                                            video
                                                        )
                                                    }
                                                    onRetryImage={() =>
                                                        handleRetryVideo(
                                                            video.id
                                                        )
                                                    }
                                                    onRescueVideo={() =>
                                                        handleRescueVideo(
                                                            video.id
                                                        )
                                                    }
                                                    onZoom={(url) =>
                                                        setLightboxUrl(url)
                                                    }
                                                />
                                            )
                                        })}
                                </div>
                            </>
                        )}

                        {/* Empty state */}
                        {currentVideoBatch.filter(
                            (v) =>
                                (activeSubTab === "veo_video" &&
                                    v.category === "veo") ||
                                (activeSubTab === "zakhaar_video" &&
                                    v.category === "zakhaar")
                        ).length === 0 &&
                            !generatingVideo && (
                                <div className="at-empty">
                                    Sin video activo. Pica el botón
                                    arriba para materializar UN Reel.
                                    Cada video cuesta ~$3.03 USD
                                    (Seedance 2.0 Standard 10s) —
                                    generamos de a uno por click.
                                </div>
                            )}

                        {/* Historial de videos */}
                        <div className="at-section-header">
                            <span>Historial · video</span>
                            <span className="at-section-header-count">
                                {filteredHistoryVideo.length} videos
                            </span>
                        </div>

                        <div className="at-history-filters">
                            <button
                                className={`at-filter ${histVideoCategoryFilter === "all" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoCategoryFilter("all")
                                }
                            >
                                Todas
                            </button>
                            <button
                                className={`at-filter ${histVideoCategoryFilter === "veo" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoCategoryFilter("veo")
                                }
                            >
                                VEO
                            </button>
                            <button
                                className={`at-filter ${histVideoCategoryFilter === "zakhaar" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoCategoryFilter("zakhaar")
                                }
                            >
                                ZakHaar
                            </button>
                            <span style={{ flex: 1 }} />
                            <button
                                className={`at-filter ${histVideoStatusFilter === "all" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoStatusFilter("all")
                                }
                            >
                                Todos estados
                            </button>
                            <button
                                className={`at-filter ${histVideoStatusFilter === "approved" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoStatusFilter("approved")
                                }
                            >
                                Aprobados
                            </button>
                            <button
                                className={`at-filter ${histVideoStatusFilter === "published" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoStatusFilter("published")
                                }
                            >
                                Publicados
                            </button>
                            <button
                                className={`at-filter ${histVideoStatusFilter === "draft" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoStatusFilter("draft")
                                }
                            >
                                Borrador
                            </button>
                            <button
                                className={`at-filter ${histVideoStatusFilter === "incomplete" ? "active" : ""}`}
                                onClick={() =>
                                    setHistVideoStatusFilter("incomplete")
                                }
                                title="Videos atascados sin mp4 + videos marcados como rechazados"
                            >
                                Incompletos
                            </button>
                        </div>

                        {filteredHistoryVideo.length === 0 ? (
                            <div className="at-empty">
                                Sin historial bajo estos filtros.
                            </div>
                        ) : (
                            <div className="at-grid">
                                {filteredHistoryVideo
                                    .slice(0, 60)
                                    .map((video) => {
                                        const retryCount =
                                            autoRetriedVideoRef.current.get(
                                                video.id
                                            ) ?? 0
                                        return (
                                            <VideoCard
                                                key={video.id}
                                                video={video}
                                                isProcessing={
                                                    processingVideoId ===
                                                    video.id
                                                }
                                                autoRetryCount={
                                                    retryCount
                                                }
                                                autoRetriesExhausted={
                                                    retryCount >=
                                                    MAX_AUTO_RETRIES
                                                }
                                                onApprove={() =>
                                                    handleUpdateVideoStatus(
                                                        video.id,
                                                        "approved"
                                                    )
                                                }
                                                onPublish={() =>
                                                    handleUpdateVideoStatus(
                                                        video.id,
                                                        "published"
                                                    )
                                                }
                                                onReroll={() =>
                                                    handleRerollVideo(
                                                        video.id
                                                    )
                                                }
                                                onDownload={() =>
                                                    handleDownloadVideo(
                                                        video
                                                    )
                                                }
                                                onCopy={() =>
                                                    handleCopyVideo(video)
                                                }
                                                onDelete={() =>
                                                    handleDeleteVideo(
                                                        video
                                                    )
                                                }
                                                onRetryImage={() =>
                                                    handleRetryVideo(
                                                        video.id
                                                    )
                                                }
                                                onRescueVideo={() =>
                                                    handleRescueVideo(
                                                        video.id
                                                    )
                                                }
                                                onZoom={(url) =>
                                                    setLightboxUrl(url)
                                                }
                                            />
                                        )
                                    })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ─── Toast ─── */}
            <AnimatePresence>
                {toast &&
                    createPortal(
                        <motion.div
                            className="at-toast"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.25 }}
                        >
                            {toast}
                        </motion.div>,
                        document.body
                    )}
            </AnimatePresence>

            {/* ─── Lightbox (v1.7: soporta imagen O video) ─── */}
            {lightboxUrl &&
                createPortal(
                    <div
                        className="at-lightbox"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <button
                            className="at-lightbox-close"
                            onClick={(e) => {
                                e.stopPropagation()
                                setLightboxUrl(null)
                            }}
                        >
                            ×
                        </button>
                        {/\.mp4(\?|$)/i.test(lightboxUrl) ? (
                            <video
                                src={lightboxUrl}
                                controls
                                autoPlay
                                playsInline
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <img src={lightboxUrl} alt="Vista ampliada" />
                        )}
                    </div>,
                    document.body
                )}
        </div>
    )
}
