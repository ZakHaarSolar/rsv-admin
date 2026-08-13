// Red Solar Viva · admin-action v1.53 — 🜂 EL AFINAMIENTO DE LA MATRIZ: rutea
// admin_espejo_afinamiento + admin_espejo_afinamiento_estado (Motor → "Voz" →
// pestaña Matriz). Es el bucle de mejora del Espejo, hermano del de la voz,
// pero un nivel más arriba: de estas marcas salen las LEYES del prompt.
// Requiere migración 20260813b_espejo_afinamiento.
// Red Solar Viva · admin-action v1.52 — 🜂 EL PANEL DE VOZ APRENDE A SOLTAR:
// rutea admin_voz_frases_borrar (Motor → "Voz"), el borrado por texto de las
// frases sin resolver — pruebas propias, ruido, o carencias ya convertidas en
// ejemplos del prompt salen de la lista en vez de acumularse. Requiere
// migración 20260813_voz_frases_borrar.
// Red Solar Viva · admin-action v1.51 — 🜂 LO QUE LA VOZ NO ENTENDIÓ: rutea
// admin_voz_frases_top (Motor → "Voz"), la lectura de voz_frases_sin_resolver que
// hasta ahora nadie podía pedir — la tabla se llenaba desde voz-intent y la RPC
// existía grantada solo a service_role, sin puerta desde el navegador. Cierra el
// bucle de mejora: las frases más repetidas se vuelven ejemplos del prompt.
// Requiere migración 20260806_voz_frases_sin_resolver (ya aplicada).
// Red Solar Viva · admin-action v1.50 — SOPORTE SE VUELVE CONVERSACIÓN: rutea
// admin_soporte_mensaje (la casa responde un caso, o abre uno desde un correo para
// avisar de una transferencia hecha sin caso previo, o para PROBAR el aviso sin
// tocar nada; dispara el push por el mismo camino que los DM) + delete_onb_funnel_all
// (borrado TOTAL del embudo del onboarding). Requiere 20260807c_soporte_conversacion.
// Red Solar Viva · admin-action v1.49 — rutea el PANEL DE SOPORTE (Motor → "Soporte"):
// admin_get_support_tickets + admin_set_support_ticket_status (bandeja de casos que
// llegan desde Ajustes → Soporte), admin_soporte_buscar_cuenta (el CRUCE: perfil +
// suscripciones + pagos reales de un correo, para contrastar contra lo que la persona
// dijo), admin_soporte_transferir_suscripcion (mueve el acceso de un correo a otro en
// un clic, con guardas + libro mayor) y admin_soporte_bitacora. Requiere migración
// 20260807_soporte. Los últimos 4 de la tarjeta los trae la edge `soporte-stripe`
// (no viven en nuestra base).
// Red Solar Viva · admin-action v1.48 — rutea admin_grant_image_pass + admin_get_image_pass (pase de imágenes del
// Arquitecto: el Motor → IAs otorga extras del día sobre el tope de 2/día del Reflejo ilustrado; el destinatario NO es
// parámetro, la RPC lo fija a cuerpodeluz555@gmail.com). Requiere migración 20260806_pase_imagen_arquitecto.
// Red Solar Viva · admin-action v1.48 — rutea get_tripulante_foto (la foto que
// el Tripulante eligió DENTRO de la app; la de Clerk queda congelada al
// identificarse). Requiere migración 20260806c_foto_de_la_app.
// Red Solar Viva · admin-action v1.47 — rutea get_tripulante_espejo_onb (reflejos
// del Espejo + respuestas del onboarding en la ficha del nodo). Requiere
// migración 20260806_motor_ficha_nodo.
// Red Solar Viva · admin-action v1.46 — rutea get_tripulante_platforms (qué
// aparato usa cada nodo: iPhone / Android / navegador, unido de push_tokens y
// nav_events). RPC aparte de get_tripulante_extras a propósito: si falla, se
// pierde la etiqueta del aparato, nunca la ficha entera. Requiere migración
// 20260804b_extras_plataforma.
// Red Solar Viva · admin-action v1.45 — rutea admin_get_app_release_log (BITÁCORA
// de avisos de la app: qué versiones se publicaron y cuándo se activó/desactivó el
// freno de emergencia). Requiere migración 20260805b_bitacora_avisos_app.
// Red Solar Viva · admin-action v1.44 — rutea admin_set_app_lockdown (BLOQUEO
// DE EMERGENCIA del Motor → "App": pantalla sin salida + botón a la App Store
// para versiones ANTERIORES a la mínima marcada — freno de mano ante un gasto
// desbocado o una fuga sin esperar la revisión de Apple). Requiere migración
// 20260730_app_lockdown; el cliente es fail-open (sin red = deja pasar).
// | v1.43 — rutea admin_get_user_sonda_progress (Padrón → detalle del nodo: hasta qué pregunta llegó en cada uno de los 6 pilares —2 de 8, 7 de 8—, cuáles selló y cuáles no empezó; sirve para ver si abandonan el escaneo y dónde). Requiere migración 20260727_motor_cortesia_y_sondas, que además reemplaza admin_get_gift_status por la versión con VIGENCIA de la Cortesía Solar (misma firma, no requiere cambio de gateway).
// Red Solar Viva · admin-action v1.42 — AUDITORÍA 2026-07-24 · PARTE 2 (hallazgo CRÍTICO): rutea delete_sonda + delete_protocolo_admin + reorder_sondas (el BORRADO del editor del Motor, que el lockdown 20260724c dejó fuera: verificado en vivo, respondían {"success":true} a la anon key SIN chequeo de admin → borrado del instrumento central sin backups) + get_revenue_history (ingresos del negocio, sin parámetro de identidad → el gate solo puede ser el gateway). idParam null en las 4. Requiere migración 20260724g + MI_Editores/TN_Shared migrados a adminAction().
// Red Solar Viva · admin-action v1.41 — AUDITORÍA 2026-07-24 · PARTE 2: rutea get_codices_luz_admin + delete_codice_luz_admin (los Códices de Luz que alimentan carruseles y Reels). Estaban GRANTed a anon con p_admin_clerk_id forjable y los paneles del Atelier (AT_ZakHaarCarrusel / AT_EstudioManual) las llamaban por REST directo, así que no se podían REVOKEar sin romperlos. Con esto entran al gateway y la migración 20260724f las cierra. Desplegar ANTES de pegar 20260724f.
// Red Solar Viva · admin-action v1.40 — AUDITORÍA 2026-07-24: rutea las 4 RPC del editor del Motor (get_all_sondas, get_all_protocolos_admin, upsert_sonda, upsert_protocolo_admin) que estaban GRANTed a anon SIN chequeo de admin desde 20260705 — cualquiera con la anon key leía las 60 fases de Calibración (contenido de paga) y podía REESCRIBIR las 36 sondas del Escáner. idParam null: el gate es el gateway. Requiere migración 20260724c_lockdown_editor_rpcs + publicar el Motor migrado a adminAction().
// Red Solar Viva · admin-action v1.39 — suma el PADRÓN DE CORREOS (Motor → "Correos"): admin_get_subscribers (lista unificada y deduplicada de correos del ecosistema — lista de Android de la landing + cuentas de la app + pases de Cámara Solar — excluyendo cuentas internas y opt-outs; el flag p_only_android devuelve SOLO la waitlist) + admin_mark_android_notified (sella notified_at de la lista pendiente tras avisar del lanzamiento). Requiere migración 20260720_android_waitlist.
// Red Solar Viva · admin-action v1.38 — suma DECODIFICADOR DE CROP CIRCLES (admin_get_crop_circles + admin_upsert/delete_crop_circle + admin_publish_crop_circle: registro planetario editable desde el Motor; publicar con p_notify=true dispara el push broadcast a todos los nodos con token, respetando notif_prefs). La imagen la sube el edge upload-crop-circle; la lectura pública (get_crop_circles) es RPC anon directa. Requiere migración 20260719_crop_circles.
// Red Solar Viva · admin-action v1.37 — suma get_onb_sessions (Motor → "Onboarding" → "Sesiones": lista anónima por instalación —Usuario 1, 2…— con hasta qué pantalla llegó cada uno y QUÉ contestó en las 4 preguntas del quiz, para afinar el onboarding con data real; sin correo ni nombre). Requiere migración 20260715_onb_answers.
// Red Solar Viva · admin-action v1.36 — suma delete_onb_funnel_recent (Motor → "Onboarding" → botón "Borrar mis pruebas": borra los registros del embudo de las últimas 1/3/6/12h, para limpiar la data que genera uno mismo al recorrer el onboarding). Requiere migración 20260713c_onb_funnel_delete.
// Red Solar Viva · admin-action v1.35 — suma get_onb_funnel (Motor → "Onboarding": embudo anónimo del OnboardingV2 — cuántos nuevos llegan a cada pantalla y cuántos alcanzan el paywall; el registro lo hace el cliente pre-login vía record_onb_step anon directo). Requiere migración 20260713_onb_funnel.
// Red Solar Viva · admin-action v1.34 — Frecuencias Sonoras suma set_suno_produced_admin (marca una pieza como PRODUCIDA en Suno, con link al track — cierra el ciclo creación → producción en la Biblioteca). Requiere migración 20260710_suno_produced_cover.
// Red Solar Viva · admin-action v1.33 — Frecuencias Sonoras suma group_suno_creations_into_album + rename_suno_set_admin + ungroup_suno_creation_admin (Biblioteca: junta piezas sueltas en un álbum, renombra, o saca una pieza). Requiere migración 20260709e_suno_grouping.
// Red Solar Viva · admin-action v1.32 — Frecuencias Sonoras suma delete_suno_set_admin (borra un ÁLBUM entero por set_id; el panel ahora crea 1 pieza O un álbum de N piezas). Requiere migración 20260709d_suno_album_output.
// Red Solar Viva · admin-action v1.31 — suma FRECUENCIAS SONORAS (panel generador de prompts para Suno): get_suno_catalog_admin (7 álbumes + 70 tracks del Norte) + set_suno_album_active_admin (activar/desactivar un álbum) + get_suno_creations_admin (galería) + delete_suno_creation_admin. El edge generate-suno-prompt genera/escribe la galería con service_role. Requiere migración 20260709c_suno_frecuencias.
// Red Solar Viva · admin-action v1.30 — suma CRUD de la capa BIÓSFERA (admin_get_biosfera_tracks + admin_upsert/delete_biosfera_track: registra/edita las pistas acústicas de los Nodos Vegetales; el audio vive en R2 y se referencia por audio_url). La lectura pública (get_biosfera_tracks) es RPC anon directa. Requiere migración 20260707_biosfera_tracks.
// Red Solar Viva · admin-action v1.29 — suma la telemetría del CONTADOR DE RACHAS: admin_get_user_rachas (Padrón → detalle del nodo: cuántas rachas activas + días de cada una + membresía, SIN títulos por ética) + admin_get_rachas_anon (pestaña "Rachas" del Motor: títulos + días ANONIMIZADOS, sin identidad — espejo del panel del Espejo). Requiere migración 20260706b_rachas_admin.
// Red Solar Viva · admin-action v1.29 — suma admin_get_gift_status (estado del regalo de Sintonía de un nodo: pendiente/aceptado) + admin_cancel_gift_offer (cancela la invitación PENDIENTE, borra el gift_offer no reclamado → el Motor muestra "Regalo pendiente" y puede retirar la invitación). Requiere migración 20260709b_gift_admin_status_cancel. | v1.28 — suma admin_set_app_flag (toggle ON/OFF de la Cámara Solar desde el Motor → tabla app_flags; oculta las sesiones grupales de /sesiones y Mi Núcleo). Requiere migración 20260702_app_flags. | v1.27 — suma get_app_version_summary (badge del Motor: versión de app más alta reportada por los nodos, para verificar que APP_VERSION esté bien marcado antes de subir a Apple). Requiere migración 20260630_app_version_summary. | v1.26 — suma admin_set_app_release (aviso de nueva versión: Motor → "App") + admin_offer_gift_sintonia (regalo de Sintonía con celebración: crea el regalo pendiente que el Tripulante acepta en la app). Requiere migraciones 20260629_app_release + 20260629b_gift_sintonia.
// Red Solar Viva · admin-action v1.26 — suma admin_get_oraculo_conversations (Motor → "Espejo": lee conversaciones recientes del Espejo Vibracional, ANONIMIZADAS, para afinar la calidad). Requiere migración 20260630_oraculo_admin_view.
// v1.25 — suma admin_get_app_feedback (Buzón de ideas: el Motor lee las sugerencias que mandan los Tripulantes desde "Tu voz construye el Escáner"). Requiere migración 20260627b_app_feedback (RPC ya creada, dormant).
// Red Solar Viva · admin-action v1.24 — suma CRUD de STICKERS de marca (Parte 3 de Mensajería): admin_get_sticker_packs + admin_upsert/delete_sticker_pack + admin_add/update/delete_sticker. Editor del Motor → "Stickers"; el arte lo sube el edge upload-sticker. Packs premium ↔ Sintonía.
// v1.22 — suma Atelier de Wallpapers (get_wallpaper_prompts_admin + delete_wallpaper_prompt: lista/borra los prompts del generador de wallpapers del Motor; los INSERTA el edge generate-wallpaper-prompt)
// v1.23 — suma admin_reset_user_medals (Motor → Medallas → reseteador QA: borra los desbloqueos de medallas de un Tripulante por correo, para una constelación o todas).
// v1.22 — suma get_wallpaper_download_telemetry (Motor → Wallpapers → Telemetría: cuáles Anclajes Fotónicos se descargan más; admin gate + excluye cuentas internas como la Telemetría de Navegación).
// v1.21 — suma MODERACIÓN de Comunidad (admin_get_moderation_queue / admin_get_user_moderation / admin_resolve_report / admin_ban_community_user / admin_unban_community_user: cola de reportes + banear) + editor de CONSTELACIONES DE MAESTRÍA (admin_get_medallas / admin_upsert_medal_tier / admin_set_medal_constelacion: umbrales editables sin build)
// v1.20 — suma herramientas admin: admin_reset_avatar (borra avatar elegido + comprado de un Tripulante por email → re-elige desde cero) + admin_send_dm (manda un DM a cualquier Tripulante por email; dispara el push — sirve para probar con un solo dispositivo)
// v1.19 — suma editor del Catálogo de Intereses de la Comunidad (admin_get/upsert/delete_community_interest: categorías DB-driven del directorio, sin build)
// v1.18 — suma editor del Campo Solar colectivo (admin_get/adjust_campo_solar: mueve el total del colectivo vía una cuenta semilla que SÍ cuenta, para pruebas, ya que la cuenta admin está excluida)
// v1.17 — suma editor del catálogo de la Cámara de Cristalización (admin_get/upsert/delete_crystal_item: avatares + elementos comprables con Fotones, precios/requisitos DB-driven sin build)
// v1.16 — suma Panel de Avatares de Luz (admin_get/upsert_avatar_config: umbrales de etapa + params DB-driven, sin build) + ajustador de Fotones de prueba (admin_get/adjust/set_user_fotones: server-authoritative vía daily_checkins, fila sentinela que no toca today/racha)
// v1.15 — suma editor del Catálogo de Rituales del Motor (admin_get_ritual_catalog + admin_upsert/delete_ritual_activity; cambiar points = cambiar los Fotones que otorga el server, sin build)
// v1.14 — suma CRUD de Categorías de Wallpapers (admin_get/upsert/delete_wallpaper_category + admin_set_wallpaper_category para asignar categoría a un wallpaper)
// v1.13 — suma CRUD de Wallpapers (admin_get_wallpapers + admin_upsert_wallpaper + admin_delete_wallpaper; las filas las CREA el edge upload-wallpaper)
// v1.12 — suma admin_get_user_ritual_data (datos del Ritual Diario de un tripulante para el Padrón: Fotones, racha, activos, últimos 7 días, uso por ritual)
// v1.11 — suma editor de Afirmaciones del Ritual Diario (admin_get_ritual_afirmaciones + admin_upsert/delete categoría + admin_upsert/delete afirmación; id admin inyectado por el gateway)
// v1.10 — telemetría de navegación v2: get_nav_telemetry (agregado + nodos + por-día + Sin Repetición + exclusión) + get_nav_telemetry_node (drill-down)
// v1.8 — suma familia Observatorio (barrido profundo 2026-06-13, Batch 3)
// =====================================================================
// Gateway verificado para las RPC admin_*. ÚNICA vía legítima de invocarlas
// una vez que se hace REVOKE anon: solo service_role puede ejecutarlas, y
// solo este gateway las llama (tras verificar el token de Clerk del admin).
//
// Patrón: verifica el token (gateAdmin → JWKS de nuestra instancia + check
// profiles.is_admin), e INYECTA p_admin_clerk_id con el id YA verificado del
// claim `sub`. Ignora cualquier p_admin_clerk_id que mande el cliente — así
// el id admin filtrado por el oráculo queda inútil (no se puede forjar el
// token firmado). Doble blindaje: el gateway verifica is_admin Y la RPC
// vuelve a chequearlo internamente con el mismo id.
//
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
// Despliegue: supabase functions deploy admin-action --no-verify-jwt
//
// Request body: { token, action: "admin_xxx", params: { ...sin p_admin_clerk_id } }
// Response: el resultado de la RPC, o { error } con status.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateAdmin } from "../_shared/clerkAuth.ts"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

// Whitelist de RPC admin_* invocables → nombre del param a SOBRESCRIBIR con el
// id admin verificado (null = el token ES el gate, los params se reenvían tal
// cual). Extender acá al sumar más RPC al gateway.
const ADMIN_RPCS: Record<string, string | null> = {
    admin_activate_sintonia: "p_admin_clerk_id",
    admin_revoke_sintonia: "p_admin_clerk_id",
    admin_grant_cristal: "p_admin_clerk_id",
    admin_revoke_cristal: "p_admin_clerk_id",
    admin_get_user_cristales: "p_admin_clerk_id",
    admin_get_user_navegante_progress: "p_admin_clerk_id",
    admin_get_user_codices_full: "p_admin_clerk_id",
    admin_upsert_expense: "p_clerk_id",
    admin_delete_expense: "p_clerk_id",
    // Pase de Exploración manual (off-platform). El param-gate ES el id admin
    // (solo valida is_admin; el explorador real va en p_name/p_email).
    admin_create_exploration_pass: "p_clerk_user_id",
    // Conteo de pases del mes/mes previo para la Telemetría (sin PII; cerró
    // la fuga anon de la tabla exploration_passes).
    admin_exploration_pass_counts: "p_admin_clerk_id",
    // Stickers de marca (Parte 3 de Mensajería): CRUD de paquetes + stickers,
    // editables desde el Motor → "Stickers" sin recompilar. El arte lo sube el
    // edge upload-sticker; estas RPC guardan/leen los metadatos.
    admin_get_sticker_packs: "p_admin_clerk_id",
    admin_upsert_sticker_pack: "p_admin_clerk_id",
    admin_delete_sticker_pack: "p_admin_clerk_id",
    admin_add_sticker: "p_admin_clerk_id",
    admin_update_sticker: "p_admin_clerk_id",
    admin_delete_sticker: "p_admin_clerk_id",
    // Herramientas de testing admin (cristales): operan sobre el propio admin
    // (p_clerk_user_id = id admin verificado inyectado por el gateway).
    admin_regenerate_cristal: "p_clerk_user_id",
    admin_reset_my_codices: "p_clerk_user_id",
    // ── Familia admin 2026-04-24 (cierre de la escalada anon→admin) ──
    // Gateaban con un p_admin_clerk_id/p_clerk_id PÚBLICO (cosechable del
    // oráculo) → el gate is_admin se derrotaba. Ahora el id admin lo inyecta
    // el gateway desde el token verificado; el del body se descarta.
    get_admin_dashboard: "p_clerk_id",            // financiero
    get_1to1_revenue_summary: "p_clerk_id",       // financiero
    get_ia_gasto_por_nodo: "p_clerk_id",          // financiero · gasto de IA por usuario (Telemetría)
    admin_grant_image_pass: "p_clerk_id",        // pase de imágenes del Arquitecto (destinatario fijo en la RPC)
    admin_get_image_pass: "p_clerk_id",          // estado del pase de imágenes
    delete_user_scan_data_admin: "p_clerk_id",    // DESTRUCTIVA
    get_tripulante_extras: "admin_clerk_id",
    // Qué aparato usa cada nodo (iPhone / Android / navegador). Va como RPC
    // aparte de extras a propósito: si algún día falla solo se pierde la
    // etiqueta del aparato, nunca la ficha entera del Tripulante.
    get_tripulante_platforms: "admin_clerk_id",
    // Reflejos del Espejo (enviados / restantes de los 3 de cortesía) +
    // qué contestó en el onboarding, para la ficha del nodo.
    get_tripulante_espejo_onb: "admin_clerk_id",
    // La foto que el Tripulante ELIGIÓ dentro de la app (community_profiles),
    // que es la viva; la de Clerk queda congelada al identificarse.
    get_tripulante_foto: "admin_clerk_id",
    // Telemetría de navegación (Motor → pestaña Navegación): agregado de
    // capas/sub-capas visitadas + drill-down por nodo. Admin gate + id del token.
    get_nav_telemetry: "admin_clerk_id",
    get_nav_telemetry_node: "admin_clerk_id",
    // Telemetría de descargas de Anclajes Fotónicos (Motor → Wallpapers →
    // Telemetría): cuáles fondos se descargan más; excluye cuentas internas.
    get_wallpaper_download_telemetry: "admin_clerk_id",
    // Versión de app más alta reportada por los nodos (badge del Motor debajo
    // del título → verificar que APP_VERSION esté bien marcado antes de Apple).
    get_app_version_summary: "p_admin_clerk_id",
    // Embudo del OnboardingV2 (Motor → "Onboarding"): hasta qué pantalla
    // llegan los usuarios nuevos (anónimo, sin identidad).
    get_onb_funnel: "p_admin_clerk_id",
    get_onb_sessions: "p_admin_clerk_id",
    delete_onb_funnel_recent: "p_admin_clerk_id",
    get_observatorio_camara_admin: "p_clerk_id",
    get_alias_nodos_sesion_admin: "p_clerk_id",
    list_analisis_profundo_admin: "p_clerk_id",
    // ── Familia "padrón/correo" del Motor (barrido profundo 2026-06-13) ──
    // Gateaban con un p_admin_clerk_id PÚBLICO + el id admin se descubría con
    // is_admin_caller → cadena anon→PII (nombres+emails del padrón, confirmada
    // viva). Ahora el id admin lo inyecta el gateway desde el token verificado;
    // el del body se descarta.
    get_profiles_no_scan: "p_admin_clerk_id",
    get_tripulantes_scan_activity: "p_admin_clerk_id",
    get_tripulantes_signup_dates: "p_admin_clerk_id",
    get_tripulantes_gift_flags: "p_admin_clerk_id",
    get_tripulantes_email_flags: "p_admin_clerk_id",
    get_email_subscription_status: "p_admin_clerk_id",
    get_email_dispatch_status: "p_admin_clerk_id",
    // ── Familia Atelier/marketing (barrido profundo 2026-06-13, Batch 2) ──
    // ~44 RPC SECURITY DEFINER gateadas sólo por un p_admin_clerk_id forjable
    // (el id admin se descubría con is_admin_caller) → un anónimo leía/borraba
    // prompts, drafts, posts y videos de marketing. Ahora el id admin lo inyecta
    // el gateway desde el token; los clientes (AtelierMarketing / AT_SomaCero /
    // AT_ZakHaarCarrusel / AT_EstudioManual) rutean su helper rpc() por acá.
    get_atelier_dashboard: "p_admin_clerk_id",
    get_atelier_banners_dashboard: "p_admin_clerk_id",
    get_atelier_video_dashboard: "p_admin_clerk_id",
    get_recent_vtli_posts: "p_admin_clerk_id",
    get_recent_vtli_drafts: "p_admin_clerk_id",
    get_recent_vtli_banners: "p_admin_clerk_id",
    get_recent_vtli_videos: "p_admin_clerk_id",
    get_recent_soma_posts: "p_admin_clerk_id",
    get_soma_atelier_dashboard: "p_admin_clerk_id",
    get_soma_posts_by_ids: "p_admin_clerk_id",
    get_zakhaar_carousels_admin: "p_admin_clerk_id",
    // Códices de Luz (fuente de carruseles/Reels destilados de los libros de Zak).
    // AUDITORÍA 2026-07-24 · Parte 2: estaban GRANTed a anon y los paneles del
    // Atelier las llamaban por REST directo; se rutean para poder REVOKEarlas.
    get_codices_luz_admin: "p_admin_clerk_id",
    delete_codice_luz_admin: "p_admin_clerk_id",
    get_vtli_colectivos: "p_admin_clerk_id",
    get_vtli_colectivos_admin: "p_admin_clerk_id",
    get_vtli_ambientes: "p_admin_clerk_id",
    get_vtli_ambientes_admin: "p_admin_clerk_id",
    get_vtli_atelier_voices: "p_admin_clerk_id",
    get_vtli_posts_by_ids: "p_admin_clerk_id",
    get_vtli_drafts_by_ids: "p_admin_clerk_id",
    get_vtli_banners_by_ids: "p_admin_clerk_id",
    get_vtli_videos_by_ids: "p_admin_clerk_id",
    delete_vtli_post: "p_admin_clerk_id",
    delete_vtli_draft: "p_admin_clerk_id",
    delete_vtli_banner: "p_admin_clerk_id",
    delete_vtli_video: "p_admin_clerk_id",
    delete_vtli_ambiente: "p_admin_clerk_id",
    delete_vtli_colectivo: "p_admin_clerk_id",
    delete_vtli_atelier_voice: "p_admin_clerk_id",
    delete_soma_post: "p_admin_clerk_id",
    delete_zakhaar_carousel: "p_admin_clerk_id",
    set_vtli_post_published: "p_admin_clerk_id",
    set_vtli_draft_published: "p_admin_clerk_id",
    set_vtli_draft_narration_takes: "p_admin_clerk_id",
    set_vtli_ambiente_active: "p_admin_clerk_id",
    set_vtli_colectivo_active: "p_admin_clerk_id",
    set_soma_post_published: "p_admin_clerk_id",
    set_zakhaar_carousel_published: "p_admin_clerk_id",
    update_vtli_post_status: "p_admin_clerk_id",
    update_vtli_draft_status: "p_admin_clerk_id",
    update_vtli_draft_narration: "p_admin_clerk_id",
    update_vtli_banner_status: "p_admin_clerk_id",
    update_vtli_video_status: "p_admin_clerk_id",
    update_soma_post_status: "p_admin_clerk_id",
    upsert_vtli_colectivo: "p_admin_clerk_id",
    upsert_vtli_ambiente: "p_admin_clerk_id",
    upsert_vtli_atelier_voice: "p_admin_clerk_id",
    // ── Familia Observatorio de Resonancia (barrido profundo 2026-06-13, Batch 3) ──
    // Gateadas por p_clerk_id/p_admin_clerk_id forjable → con el id admin
    // descubierto un anónimo leía destilaciones/citas 1:1 y reescribía
    // preguntas/telemetría/perfiles de nodo. Clientes: ObservatorioResonancia
    // Micro/Macro/Presenciales (web-only).
    get_destilacion_nodo_admin: "p_clerk_id",
    get_observatorio_1to1_admin: "p_clerk_id",
    upsert_perfil_nodo_y_alias_admin: "p_clerk_id",
    upsert_preguntas_1to1_admin: "p_clerk_id",
    upsert_telemetria_camara_admin: "p_clerk_id",
    vtli_admin_list_bookings: "p_admin_clerk_id",
    vtli_admin_cancel_booking: "p_admin_clerk_id",
    // ── Editor de Afirmaciones del Ritual Diario (Motor → "Rituales") ──
    // CRUD del catálogo curado de afirmaciones por categoría. Doble blindaje:
    // gateway valida is_admin + las RPC revalidan con el id admin inyectado.
    admin_get_ritual_afirmaciones: "p_admin_clerk_id",
    admin_upsert_ritual_categoria: "p_admin_clerk_id",
    admin_delete_ritual_categoria: "p_admin_clerk_id",
    admin_upsert_ritual_afirmacion: "p_admin_clerk_id",
    admin_delete_ritual_afirmacion: "p_admin_clerk_id",
    // Datos del Ritual Diario de un tripulante (Padrón → detalle de nodo).
    admin_get_user_ritual_data: "p_admin_clerk_id",
    // Avance de sondas por pilar de un tripulante (Padrón → detalle de nodo):
    // hasta qué pregunta llegó en cada pilar, cuáles selló, cuáles no empezó.
    admin_get_user_sonda_progress: "p_admin_clerk_id",
    // ── Wallpapers (galería de fondos descargables) ──
    // CRUD de metadatos del catálogo. Las filas las CREA el edge upload-wallpaper
    // (subida a R2 + INSERT); estas solo editan/borran/listan. La lectura pública
    // (get_wallpapers) NO va por gateway — es RPC anon directa.
    admin_get_wallpapers: "p_admin_clerk_id",
    admin_upsert_wallpaper: "p_admin_clerk_id",
    admin_delete_wallpaper: "p_admin_clerk_id",
    // ── Biósfera (pistas acústicas de los Nodos Vegetales; capa de la Holoteca) ──
    // La lectura pública (get_biosfera_tracks) NO va por gateway — es RPC anon directa.
    admin_get_biosfera_tracks: "p_admin_clerk_id",
    admin_upsert_biosfera_track: "p_admin_clerk_id",
    admin_delete_biosfera_track: "p_admin_clerk_id",
    // ── Crop Circles (Decodificador de Crop Circles; registro planetario) ──
    // CRUD del catálogo + publicar con push broadcast opcional (respeta notif_prefs).
    // La imagen la sube el edge upload-crop-circle (devuelve URL, sin INSERT).
    // La lectura pública (get_crop_circles) NO va por gateway — es RPC anon directa.
    admin_get_crop_circles: "p_admin_clerk_id",
    admin_upsert_crop_circle: "p_admin_clerk_id",
    admin_delete_crop_circle: "p_admin_clerk_id",
    admin_publish_crop_circle: "p_admin_clerk_id",
    // ── Correos (padrón para avisos masivos + lista de espera de Android) ──
    // La lista unificada NUNCA sale por vía anon: el alta pública de la landing
    // (join_android_waitlist) solo INSERTA, no lee.
    admin_get_subscribers: "p_admin_clerk_id",
    admin_mark_android_notified: "p_admin_clerk_id",
    // ── Categorías de Wallpapers (clasificación de la galería) ──
    // CRUD del catálogo de categorías + asignación de categoría a un wallpaper
    // (admin_set_wallpaper_category). La lectura pública (get_wallpaper_categories)
    // NO va por gateway — es RPC anon directa, como get_wallpapers.
    admin_get_wallpaper_categories: "p_admin_clerk_id",
    admin_upsert_wallpaper_category: "p_admin_clerk_id",
    admin_delete_wallpaper_category: "p_admin_clerk_id",
    admin_set_wallpaper_category: "p_admin_clerk_id",
    // ── Atelier de Wallpapers (generador de prompts del Motor) ──
    // Lista/borra los prompts generados (los INSERTA el edge generate-wallpaper-prompt).
    get_wallpaper_prompts_admin: "p_admin_clerk_id",
    delete_wallpaper_prompt: "p_admin_clerk_id",
    // ── Catálogo de Rituales del Ritual Diario (Motor → "Rituales") ──
    // CRUD de las actividades (daily_ritual_catalog): label, Fotones (points),
    // si pide texto, activo y orden. Cambiar points cambia los Fotones que el
    // server otorga al instante (puntaje server-authoritative en toggle_ritual),
    // SIN build. El cliente lee el catálogo vía get_ritual_diario.
    admin_get_ritual_catalog: "p_admin_clerk_id",
    admin_upsert_ritual_activity: "p_admin_clerk_id",
    admin_delete_ritual_activity: "p_admin_clerk_id",
    // ── Panel de Avatares de Luz (Motor → "Avatares") ──
    // Umbrales de etapa (Fotones por etapa) + params de cada avatar (Nova/
    // Aurelia/Prisma) DB-driven: el cliente los lee vía get_avatar_config
    // (RPC pública) → cambiar la evolución del avatar SIN build. La lectura
    // pública NO va por gateway (config global, sin PII).
    admin_get_avatar_config: "p_admin_clerk_id",
    admin_upsert_avatar_config: "p_admin_clerk_id",
    // Ajustador de Fotones de prueba (server-authoritative vía daily_checkins,
    // fila sentinela que NO toca today/racha) — para ver el avatar evolucionar.
    admin_get_user_fotones: "p_admin_clerk_id",
    admin_adjust_user_fotones: "p_admin_clerk_id",
    admin_set_user_fotones: "p_admin_clerk_id",
    // ── Cámara de Cristalización: editor del catálogo (Motor → "Cristalización") ──
    // CRUD de avatares + elementos comprables (precio, requisitos de etapa/racha,
    // params del render). Precios/requisitos DB-driven → ajustables sin build.
    admin_get_crystal_catalog: "p_admin_clerk_id",
    admin_upsert_crystal_item: "p_admin_clerk_id",
    admin_delete_crystal_item: "p_admin_clerk_id",
    // ── Campo Solar colectivo: editor del total (pruebas) ──
    // La cuenta admin está EXCLUIDA del colectivo → para mover el número
    // sumamos/restamos a una cuenta semilla que SÍ cuenta. reset (delta = −seed)
    // devuelve el campo a su estado natural.
    admin_get_campo_solar: "p_admin_clerk_id",
    admin_adjust_campo_solar: "p_admin_clerk_id",
    // ── Capa de Comunidad: editor del catálogo de intereses (Motor → "Comunidad") ──
    admin_get_community_interests: "p_admin_clerk_id",
    admin_upsert_community_interest: "p_admin_clerk_id",
    admin_delete_community_interest: "p_admin_clerk_id",
    // ── Herramientas admin: reset de avatar + enviar DM a un Tripulante ──
    admin_reset_avatar: "p_admin_clerk_id",
    admin_send_dm: "p_admin_clerk_id",
    // ── Moderación de Comunidad (Motor → "Moderación") ──
    // Cola de reportes pendientes + detalle de un Tripulante + resolver/banear.
    // Doble blindaje: gateway valida is_admin + las RPC lo revalidan.
    admin_get_moderation_queue: "p_admin_clerk_id",
    admin_get_user_moderation: "p_admin_clerk_id",
    admin_resolve_report: "p_admin_clerk_id",
    admin_ban_community_user: "p_admin_clerk_id",
    admin_unban_community_user: "p_admin_clerk_id",
    // ── Constelaciones de Maestría: editor de umbrales (Motor → "Medallas") ──
    admin_get_medallas: "p_admin_clerk_id",
    admin_upsert_medal_tier: "p_admin_clerk_id",
    admin_set_medal_constelacion: "p_admin_clerk_id",
    // Reseteador de medallas (QA): borra los desbloqueos de un Tripulante por correo.
    admin_reset_user_medals: "p_admin_clerk_id",
    // Buzón de ideas (Motor → "Buzón"): lee las sugerencias de los Tripulantes.
    admin_get_app_feedback: "p_admin_clerk_id",
    // SOPORTE (Motor → "Soporte"): bandeja de casos + el cruce contra el pago
    // real + la transferencia de suscripción de un correo a otro + el libro
    // mayor de lo que el panel hizo. Requiere migración 20260807_soporte.
    admin_get_support_tickets: "p_admin_clerk_id",
    admin_set_support_ticket_status: "p_admin_clerk_id",
    admin_soporte_buscar_cuenta: "p_admin_clerk_id",
    admin_soporte_transferir_suscripcion: "p_admin_clerk_id",
    admin_soporte_bitacora: "p_admin_clerk_id",
    // La casa RESPONDE un caso (o abre uno desde el correo, para avisar de una
    // transferencia hecha sin caso previo, o para probar el aviso). Dispara el
    // push por el mismo camino que los DM. Requiere 20260807c_soporte_conversacion.
    admin_soporte_mensaje: "p_admin_clerk_id",
    // Embudo del Onboarding: borrado TOTAL (mientras los testers somos
    // nosotros, cualquier ventana de 30/90 días cuenta pruebas propias).
    delete_onb_funnel_all: "p_admin_clerk_id",
    // Espejo Vibracional (Motor → "Espejo"): lee conversaciones recientes
    // ANONIMIZADAS (sin email/nombre) para afinar la calidad del asistente.
    admin_get_oraculo_conversations: "p_admin_clerk_id",
    // 🜂 LO QUE LA VOZ NO ENTENDIÓ (Motor → "Voz"): las frases que la
    // interpretación devolvió como UNKNOWN, agrupadas y ordenadas por cuánta
    // GENTE DISTINTA las dijo. Es el bucle de mejora: esas frases se vuelven
    // ejemplos del prompt de voz-intent y vocabulario del reconocedor local.
    // Sin identidad: la tabla solo guarda un hash irreversible con sal, cuyo
    // único uso es no contar diez veces al mismo. Requiere migración
    // 20260806_voz_frases_sin_resolver.
    admin_voz_frases_top: "p_admin_clerk_id",
    // Y su reverso: BORRAR entradas del panel por texto (pruebas propias,
    // ruido, o frases ya convertidas en ejemplos del prompt). Barre todas las
    // filas cuyo texto normalizado coincida. Requiere 20260813_voz_frases_borrar.
    admin_voz_frases_borrar: "p_admin_clerk_id",
    // 🜂 AFINAMIENTO DEL ESPEJO (Motor → "Voz" → pestaña Matriz): los reflejos
    // que alguien marcó como fuera de visión, con el ángulo correcto en sus
    // palabras. Mismo bucle que las frases de voz, un nivel más arriba: de acá
    // salen las LEYES del prompt, no los sinónimos de un comando. Sin
    // identidad (hash corto). Requiere 20260813b_espejo_afinamiento.
    admin_espejo_afinamiento: "p_admin_clerk_id",
    admin_espejo_afinamiento_estado: "p_admin_clerk_id",
    // Aviso de nueva versión (Motor → "App"): fija última versión + mensaje + link.
    admin_set_app_release: "p_admin_clerk_id",
    // BLOQUEO DE EMERGENCIA (Motor → "App"): pantalla sin salida para versiones
    // ANTERIORES a lock_min_version (freno de mano ante gasto desbocado/fuga).
    // Requiere migración 20260730_app_lockdown. Fail-open en el cliente.
    admin_set_app_lockdown: "p_admin_clerk_id",
    // BITÁCORA de la pestaña App: qué versiones se publicaron y cuándo se
    // activó/desactivó el freno de emergencia (quién y qué había antes).
    // Requiere migración 20260805b_bitacora_avisos_app.
    admin_get_app_release_log: "p_admin_clerk_id",
    // Toggle de la Cámara Solar (Motor → fila del título): oculta/muestra las
    // sesiones grupales en /sesiones y Mi Núcleo (flag app_flags:hide_camara_solar).
    admin_set_app_flag: "p_admin_clerk_id",
    // Regalo de Sintonía con celebración (Motor → Nodos Activos): crea el regalo
    // pendiente; el Tripulante lo acepta en la app y ahí se activa.
    admin_offer_gift_sintonia: "p_admin_clerk_id",
    // Estado del regalo del nodo (pendiente/aceptado) + cancelar la invitación
    // pendiente (borra el gift_offer no reclamado). Requiere 20260709b.
    admin_get_gift_status: "p_admin_clerk_id",
    admin_cancel_gift_offer: "p_admin_clerk_id",
    // 🜂 EL CUARTO INTENTO DEL ESPEJO (Motor → Nodos Activos → ficha del nodo):
    // cuántas veces esta persona quiso enviar un reflejo con sus 3 de cortesía
    // ya gastados. Lo escribe oraculo-chat en el punto donde corta.
    // Requiere migración 20260809b_espejo_muro_cuarto.
    admin_get_espejo_muro: "p_admin_clerk_id",
    // Contador de RACHAS — telemetría admin: por nodo SIN títulos (ética:
    // texto libre íntimo, mismo criterio que sueños/Espejo) + lista anónima
    // CON títulos para entender el uso de la capa sin identidad.
    admin_get_user_rachas: "p_admin_clerk_id",
    admin_get_rachas_anon: "p_admin_clerk_id",
    // ── Frecuencias Sonoras (panel generador de prompts para Suno) ──
    // Catálogo de Norte (7 álbumes + 70 tracks) + galería de creaciones. El
    // edge generate-suno-prompt genera y ESCRIBE la galería con service_role;
    // estas RPC leen/editan (activar álbumes, listar/borrar creaciones).
    // Requiere migración 20260709c_suno_frecuencias.
    get_suno_catalog_admin: "p_admin_clerk_id",
    set_suno_album_active_admin: "p_admin_clerk_id",
    get_suno_creations_admin: "p_admin_clerk_id",
    delete_suno_creation_admin: "p_admin_clerk_id",
    delete_suno_set_admin: "p_admin_clerk_id",
    // Agrupar piezas sueltas en un álbum / renombrar / desagrupar (Biblioteca).
    group_suno_creations_into_album: "p_admin_clerk_id",
    rename_suno_set_admin: "p_admin_clerk_id",
    ungroup_suno_creation_admin: "p_admin_clerk_id",
    // Producida en Suno (por pieza, con link al track). Requiere 20260710.
    set_suno_produced_admin: "p_admin_clerk_id",
    // ── Auditoría 2026-07-24 · editor del Motor (sondas + calibraciones) ──
    // Estas 4 estaban GRANTed a anon desde 20260705 y SIN chequeo de admin
    // en su cuerpo: cualquiera con la anon key leía las 60 fases de
    // Calibración (contenido de paga) y podía REESCRIBIR las 36 sondas del
    // Escáner. No reciben un id de admin por parámetro, así que el gate es
    // el propio gateway → idParam null (verifica is_admin, no inyecta nada).
    // Requiere la migración 20260724c_lockdown_editor_rpcs.
    get_all_sondas: null,
    get_all_protocolos_admin: null,
    upsert_sonda: null,
    upsert_protocolo_admin: null,
    // AUDITORÍA 2026-07-24 · PARTE 2 — lo que 20260724c DEJÓ FUERA: el BORRADO.
    // Verificado en vivo con la anon key: delete_sonda respondía
    // {"success":true,"deleted":"<id>"} SIN ningún chequeo de admin. Cualquiera
    // con la llave pública podía borrar las sondas del Escáner y las fases de
    // Calibración una por una, y desordenar un pilar. Sin backups (plan Free).
    delete_sonda: null,
    delete_protocolo_admin: null,
    reorder_sondas: null,
    // Historial de INGRESOS del negocio: no recibe ningún identificador, así
    // que la RPC no puede gatear sola → el gate tiene que ser el gateway.
    // Verificado en vivo: devolvía las cifras reales de facturación a anon.
    get_revenue_history: null,
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405)
    }

    const body = await req.json().catch(() => ({}))

    const gate = await gateAdmin(body?.token)
    if (!gate.ok) {
        return json({ error: gate.error }, gate.status || 401)
    }

    const action = (body?.action || "").toString()
    if (!(action in ADMIN_RPCS)) {
        return json({ error: "action_not_allowed" }, 400)
    }

    // Sobrescribe el param-gate con el id admin VERIFICADO; descarta el del body.
    const idParam = ADMIN_RPCS[action]
    const params = { ...(body?.params || {}) }
    if (idParam) params[idParam] = gate.userId

    const { data, error } = await supabase.rpc(action, params)
    if (error) {
        console.error(`[admin-action] ${action} fail:`, error.message)
        return json({ error: error.message, code: error.code }, 400)
    }

    return json(data ?? null)
})
