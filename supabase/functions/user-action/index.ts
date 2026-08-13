// Red Solar Viva · user-action v1.48 — 🜂 AFINAMIENTO DEL ESPEJO: rutea
// registrar_afinamiento_espejo, la marca de "esto no me representa" sobre un
// reflejo con el ángulo correcto en las palabras de quien corrige. Cierra el
// bucle de mejora del Espejo igual que el panel de Voz cerró el de los
// comandos. Requiere migración 20260813b_espejo_afinamiento.
// Red Solar Viva · user-action v1.47 — SOPORTE ES CONVERSACIÓN: suma
// get_my_support_tickets / add_support_message / mark_support_read. El caso deja de
// ser un formulario que se manda y se olvida: el Tripulante ve su hilo dentro de
// Ajustes, con el estado a la vista, y puede responder (si estaba resuelto se
// reabre). submit_support_ticket gana el aparato y la versión del sistema.
// Requiere 20260807c_soporte_conversacion + redeploy.
// Red Solar Viva · user-action v1.46 — SOPORTE: suma submit_support_ticket (la puerta
// de contacto de Ajustes, aparte del buzón de ideas). El correo de la cuenta, la
// plataforma, la versión y el idioma viajan con el reporte para que el Arquitecto no
// tenga que preguntarlos; el correo NO es parámetro del cliente, lo resuelve la RPC
// contra profiles con el id verificado. Requiere migración 20260807_soporte + redeploy.
// Red Solar Viva · user-action v1.45 — ESPEJO · FASE D (memoria destilada): suma
// espejo_memoria_forget ("Olvidar todo": borra la ficha; lo viejo NO se
// re-aprende) y espejo_memoria_regenerate ("Reescribir desde cero": descarta
// ficha + marcas → el cron reconstruye releyendo las charlas). El interruptor
// memoria_enabled viaja por set_espejo_context_prefs (p_memoria, param nuevo
// con DEFAULT — mismo action, cero cambio aquí). Requiere migración
// 20260729c_espejo_memoria + redeploy.
// Red Solar Viva · user-action v1.44 — ESPEJO · CONTEXTO VIVO Fase 2: suma
// get_espejo_context_prefs / set_espejo_context_prefs (los interruptores de
// Ajustes → "Espejo Vibracional": contexto vivo maestro + compartir sueños,
// apagado de fábrica). Ambas son service_role-only (la ficha concentra el
// perfil entero de una persona) y el id verificado lo inyecta este gateway.
// Requiere migración 20260729b_espejo_prefs_get + redeploy.
// Red Solar Viva · user-action v1.43 — AUDITORÍA 2026-07-24: suma get_crop_decode (el muro de Crop Circles pasa a ser SERVER-AUTHORITATIVE: get_crop_circles dejó de emitir decoded_es/decoded_en —los entregaba a anon para las 121 formaciones— y el significado se pide por esta RPC, que valida miembro/ya-descifrado/cupo y consume el cupo atómicamente). Requiere migración 20260724d_crop_paywall_server_side + redeploy.
// Red Solar Viva · user-action v1.42 — suma get_my_crop_decodes / record_crop_decode (MURO DE CROP CIRCLES: el registro es libre para siempre —planeta, años, ficha, foto, patrón— y lo que se paga es la DECODIFICACIÓN: 3 libres de por vida a elección del Tripulante, y re-abrir una ya descifrada no consume otra). Requiere migración 20260724b_crop_decodes + redeploy.
// Red Solar Viva · user-action v1.41 — suma get_my_vision_session_count / record_vision_session (MURO DEL VISOR DE REALIDAD: una sesión libre y completa por Tripulante; el muro salta AL SALIR del lente esa primera vez —el pico— y en cada intento posterior. La sesión se registra solo si fue real: capturó algo o vivió el campo >=12s). Requiere migración 20260724_vision_sessions + redeploy.
// Red Solar Viva · user-action v1.40 — suma get_my_notif_prefs / set_my_notif_pref (PANEL DE NOTIFICACIONES en Ajustes: el Tripulante elige qué push recibe — 'crop_circles' para nuevos crop circles, 'scan_weekly' para el recordatorio semanal del Radar; ausencia = encendido; el broadcast de crop circles y notify_radar_ready respetan estas prefs server-side). Requiere migración 20260719_crop_circles + redeploy.
// Red Solar Viva · user-action v1.39 — suma toggle_racha_pause (PAUSA de rachas: el Tripulante DESACTIVA una racha unos días —viaje/enfermedad/honestidad— sin perderla ni reiniciarla; al reactivarla el conteo sigue donde quedó, corriendo started_at por el tiempo pausado). Requiere migración 20260715_rachas_pause + redeploy.
// Red Solar Viva · user-action v1.39 — suma set_my_matter_photo (BÓVEDA DE MATERIA: foto del frente del producto ligada a un registro; la sube upload-matter-photo a R2, acá se guarda la URL en la fila propia con el id inyectado → miniatura en la Bóveda). Requiere migración 20260721_matter_photo + redeploy.
// v1.38 — suma rename_my_matter_record (BÓVEDA DE MATERIA: renombrar un escaneo — el Tripulante escanea ingredientes pero recuerda el producto por su nombre comercial → edita input_label; id inyectado por el gateway; el buscador de la Bóveda ahora filtra por nombre O ingredientes client-side). Requiere migración 20260712e_matter_rename + redeploy.
// Red Solar Viva · user-action v1.37 — suma grant_contemplacion_bonus (Realidad Elegida: los Fotones de la Contemplación pasan de toggle_ritual+guard-localStorage a un GRANT idempotente por día server-side — un solo premio diario sin importar re-anclajes/dispositivos, nunca resta; devuelve granted+points para la animación de Fotones). Requiere migración 20260712c_realidad_contemplacion_grant + redeploy.
// Red Solar Viva · user-action v1.36 — suma la REALIDAD ELEGIDA (vision board del Radar): get_my_vision / upsert_vision_answer / delete_vision_answer / seal_vision / add_vision_photo / delete_vision_photo / reanchor_vision (la visión se guarda CIFRADA en reposo — pgcrypto + Vault, patrón DMs; freemium fotos-3-libres / re-anclar-con-membresía vive server-side). Requiere migración 20260712b_realidad_elegida + redeploy.
// Red Solar Viva · user-action v1.35 — suma el PLAN DE VUELO (capa del Radar): get_my_day_tasks / upsert_day_task / toggle_day_task / move_day_task / delete_day_task / reorder_day_tasks + grant_plan_vuelo_bonus (misiones del día; freemium Hoy-libre / semana+primarios-con-membresía vive server-side; el bono de Fotones es idempotente por día). Requiere migración 20260712_plan_vuelo + redeploy.
// Red Solar Viva · user-action v1.34 — suma la BITÁCORA DE COHERENCIA (capa del Radar): get_my_notas / upsert_nota / delete_nota (cuaderno de notas; el límite freemium 5-libres/ilimitado-con-membresía vive server-side en upsert_nota). Requiere migración 20260711b_bitacora + redeploy. | v1.33 — suma dm_react_message (CORAZÓN del chat: doble toque del receptor sobre un mensaje del otro, reversible; valida participante + no-propio server-side). Requiere migración 20260707_dm_reply_heart_badge_perso + redeploy.
// Red Solar Viva · user-action v1.32 — suma el SINCRONIZADOR DE ÓRBITAS (Simuladores): create_orbita_room / join_orbita_room / get_orbita_room / orbita_room_action (salas multi-dispositivo del juego grupal; crear sala exige membresía server-side, unirse es libre). Requiere migración 20260706c_orbitas + redeploy.
// Red Solar Viva · user-action v1.31 — suma el CONTADOR DE RACHAS (capa del Radar): get_my_rachas / create_racha / reset_racha / update_racha / delete_racha (hábitos pasivos medidos en automático; el límite freemium 1-libre/30-miembro vive server-side en create_racha). Requiere migración 20260706_rachas + redeploy.
// Red Solar Viva · user-action v1.30 — suma get_my_pending_gift + claim_gift_sintonia (regalo de Sintonía con celebración: el Tripulante ve su regalo pendiente y al aceptarlo se activa la membresía). Requiere migración 20260629b_gift_sintonia + redeploy.
// Red Solar Viva · user-action v1.29 — suma set_app_version (telemetría: la app reporta su versión por nodo; id verificado inyectado, escribe profiles.app_version del propio Tripulante). Requiere migración 20260627c_app_version + redeploy.
// Red Solar Viva · user-action v1.28 — suma submit_app_feedback (Buzón de ideas/mejoras de la app; id verificado inyectado; si el Tripulante marca anónimo la RPC NO guarda el id). Requiere migración 20260627b_app_feedback + redeploy.
// v1.27 — suma get_sticker_catalog (STICKERS Parte 3: catálogo member-aware de paquetes de stickers; los premium se desbloquean con Sintonía/Inmersión; el envío usa dm_send_message).
// v1.26 — suma mark_decode_seen (gate del push "ya está listo": el cliente marca "lo vi en vivo" → la edge omite el push; sirve para Materia y Sueños vía p_kind; id inyectado por el gateway).
// v1.25 — suma get_my_matter_records / delete_my_matter_record (BÓVEDA DE MATERIA: galería permanente de decodificaciones de alimentos + borrado; el buscador corre client-side sobre el nombre del material; id inyectado por el gateway).
// v1.24 — suma get_matter_job (Decodificador de MATERIA ASÍNCRONO: espejo de get_dream_job; el cliente poolea UN job por id mientras la edge corre la cascada de Gemini en segundo plano; target_clerk_id inyectado por el gateway → solo lee la fila propia).
// v1.23 — suma get_ritual_personalizado / set_ritual_personalizado (Ritual PERSONALIZADO del Sendero: el Tripulante escribe su rutina y la activa como un ritual más por Fotones; id inyectado por el gateway).
// v1.22 — suma get_dream_job (Decodificador de Sueños ASÍNCRONO: el cliente poolea UN job por id mientras la edge corre la cascada de Gemini en segundo plano; target_clerk_id inyectado por el gateway → solo lee la fila propia).
// v1.22 — suma record_wallpaper_download (telemetría de descargas de Anclajes Fotónicos: 1 fila por guardado a Fotos; el cliente manda solo p_wallpaper_id, el id del Tripulante lo inyecta el gateway → alimenta el panel del Motor).
// v1.21 — suma get_ciudad_luz / save_ciudad_luz (CIUDAD DE LUZ, juego idle de Simuladores: estado del cosmos por Tripulante, idle server-side por delta, mutaciones tipadas; 🜂 economía CERRADA — nunca escribe en daily_checkins/Maestría/cristales). id inyectado por el gateway.
// v1.20 — suma get_home_state (UN SOLO LATIDO: membresía + ritual + medallas + no-leídos en una llamada → el cliente lo cachea y arranca el Núcleo con una fracción de los golpes al backend).
// v1.19 — suma MODERACIÓN de Comunidad (community_block_user / community_unblock_user / community_report_user / get_my_blocks: bloquear/reportar/desbloquear; id inyectado por el gateway) + CONSTELACIONES DE MAESTRÍA (get_my_medals: medallas permanentes calculadas server-side).
// v1.18 — suma dm_get_unread_count (total de mensajes no leídos → badge de la card "Mensajes" en Mi Núcleo; id inyectado por el gateway).
// v1.17 — suma register_push_token / unregister_push_token (NOTIFICACIONES PUSH: el dispositivo registra su token APNs; id inyectado por el gateway → el cliente no puede forjar a quién pertenece el token).
// v1.16 — rutea get_wallpapers member-aware (la URL full-res de los wallpapers de paga SOLO va a miembros; los bloqueados llegan con image_url=null → cierra el bypass del paywall de Wallpapers). id inyectado por el gateway.
// v1.15 — suma MENSAJERÍA de Comunidad Fase 2 (dm_start_conversation / dm_send_message / dm_get_my_conversations / dm_get_messages / dm_mark_read; DMs 1:1 entre Tripulantes visibles, participante validado, sin PII, id inyectado por el gateway)
// v1.14 — suma CAPA DE COMUNIDAD Fase 1 (get_my_community_profile / set_my_community_profile / get_community_directory / get_community_profile; perfiles públicos opt-in + intereses + directorio, id inyectado por el gateway, sin PII)
// v1.13 — suma Cámara de Cristalización (get_crystal_chamber / select_avatar / purchase_crystal_item / equip_crystal_element; sumidero de Fotones, id inyectado por el gateway)
// v1.12 — suma Afirmaciones del Ritual Diario (get_ritual_afirmaciones / set_ritual_afirmaciones_sel / upsert_ritual_afirmacion_custom / delete_ritual_afirmacion_custom; id inyectado por el gateway)
// v1.11 — suma get_ritual_diario / toggle_ritual / set_ritual_config (Ritual Diario: chequeos diarios + Fotones; id inyectado por el gateway)
// v1.10 — suma record_nav_event (telemetría de navegación: registra capa/sub-capa abierta; id inyectado por el gateway)
// v1.9 — suma rename_my_dream_record (renombrar un sueño en la Bóveda; id inyectado por el gateway, mismo patrón que delete_my_dream_record)
// v1.8 — suma get_my_decoder_scan_count (contador freemium del Decodificador de Materia; cierra el último IDOR del contador, barrido Lote F 2026-06-14)
// v1.7 — suma get_citas_1to1 (cierra IDOR de PII de sesiones 1:1: Zoom link+password+email, barrido 2026-06-13)
// =====================================================================
// Espejo de `admin-action`, pero para RPCs "del propio usuario" (no admin).
// Verifica el token de sesión de Clerk (gateUser → JWKS de nuestra instancia)
// e INYECTA el p_clerk_user_id con el id YA verificado del claim `sub`.
// Descarta cualquier clerk_user_id que mande el cliente → cierra el griefing
// donde el id viajaba forjable en el body (Ola C #8: canje de cristales).
//
// Una vez que se hace REVOKE anon de las RPC, solo service_role puede
// ejecutarlas, y solo este gateway las llama (tras verificar el token).
//
// Request body: { token, action: "<rpc>", params: { ...sin p_clerk_user_id } }
// Response: el resultado de la RPC, o { error } con status.
// Secrets: CLERK_SECRET_KEY · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
// Despliegue: supabase functions deploy user-action --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { gateUser } from "../_shared/clerkAuth.ts"

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

// Whitelist de RPC del Tripulante → nombre del param a SOBRESCRIBIR con el
// clerk_user_id verificado. Extender acá al sumar más RPC al gateway.
const USER_RPCS: Record<string, string> = {
    redeem_codice_with_cristal: "p_clerk_user_id",
    redeem_meditacion_with_cristal: "p_clerk_user_id",
    canjear_cristal: "p_clerk_user_id",
    // Radar (scan_vibracional): guardar un scan + leer el historial propio.
    save_scan_vibracional: "p_clerk_user_id",
    get_my_scan_history: "p_clerk_user_id",
    // Crop Circles: el REGISTRO es libre, el SIGNIFICADO se paga. 3
    // decodificaciones libres de por vida, a elección del Tripulante; re-abrir
    // una ya descifrada no consume otra (se guarda QUÉ crop, no un contador).
    get_my_crop_decodes: "target_clerk_id",
    record_crop_decode: "p_clerk_user_id",
    // AUDITORÍA 2026-07-24: el muro de Crop Circles era COSMÉTICO —
    // get_crop_circles entregaba decoded_es/decoded_en de las 121
    // formaciones a anon, así que el texto ya viajaba al dispositivo y el
    // velo era decoración. Ahora el SIGNIFICADO se pide aquí: la RPC
    // decide (miembro / ya descifrado / cupo libre) y consume el cupo
    // atómicamente. Requiere migración 20260724d_crop_paywall_server_side.
    get_crop_decode: "p_clerk_user_id",
    // Visor de realidad (Visión Decodificada): memoria de la ÚNICA sesión
    // libre. Cruza devices y sobrevive un cierre de app; el gate lo aplica el
    // cliente porque la capa corre 100% on-device (sin API paga que proteger).
    get_my_vision_session_count: "target_clerk_id",
    record_vision_session: "p_clerk_user_id",
    // Bóveda de Estasis (Decodificador de Sueños): galería de sueños propios +
    // contador freemium. CRÍTICO: get_my_dream_records leakeaba el texto íntegro
    // de los sueños + dictamen de cualquiera con la anon key + un id forjado.
    get_my_dream_records: "target_clerk_id",
    get_my_dream_scan_count: "target_clerk_id",
    delete_my_dream_record: "target_clerk_id",
    rename_my_dream_record: "target_clerk_id",
    // Decodificación ASÍNCRONA: el cliente poolea UN job por id (la edge lo creó
    // server-side con el id verificado; acá solo se LEE la fila propia).
    get_dream_job: "target_clerk_id",
    // Decodificador de MATERIA asíncrono: mismo patrón que get_dream_job.
    // id inyectado por el gateway.
    get_matter_job: "target_clerk_id",
    // Bóveda de Materia: galería permanente de decodificaciones + borrado +
    // renombrar (el buscador corre client-side sobre input_label + ingredientes).
    get_my_matter_records: "target_clerk_id",
    delete_my_matter_record: "target_clerk_id",
    rename_my_matter_record: "target_clerk_id",
    // Foto del frente del producto ligada a un registro (miniatura de la Bóveda).
    // La sube upload-matter-photo a R2; acá solo se guarda la URL en la fila propia.
    set_my_matter_photo: "target_clerk_id",
    // Marca "ya vi este dictamen en vivo" → la edge omite el push de
    // "ya está listo" (sirve para Materia y Sueños vía p_kind).
    mark_decode_seen: "target_clerk_id",
    // Decodificador de Materia: contador freemium propio (3 de por vida).
    get_my_decoder_scan_count: "target_clerk_id",
    // Cola IDOR baja severidad (cada uno opera sobre los datos propios).
    get_my_cristales: "p_clerk_user_id",
    get_my_membership_tier: "p_clerk_user_id",
    // LOTE F (auditoría 2026-07-27): la membresía deja de pedirse por CORREO.
    // get_my_membership(p_email) era anon-ejecutable → permitía enumerar si un
    // correo cualquiera tenía membresía activa. La vía nueva recibe el clerk id
    // que inyecta este gateway y resuelve el correo server-side contra profiles
    // (mismo patrón que get_home_state). Requiere migración 20260727e.
    get_my_membership_by_clerk: "p_clerk_user_id",
    get_my_meditaciones_owned: "p_clerk_user_id",
    get_ai_consent_at: "p_clerk_user_id",
    set_ai_consent_at: "p_clerk_user_id",
    get_my_reading_progress: "p_clerk_id",
    // Barrido profundo: perfil propio (email + full_name, PII).
    get_my_profile_basics: "p_clerk_user_id",
    // Barrido profundo: protocolos propios (IDOR — lecturas + escrituras).
    get_my_active_protocols: "p_clerk_user_id",
    get_my_protocol_states: "p_clerk_user_id",
    seed_my_protocols: "p_clerk_user_id",
    toggle_my_protocol_tarea: "p_clerk_user_id",
    // Barrido profundo: contenido de Calibraciones (paywall member-gated).
    get_libreria_protocolos: "p_clerk_user_id",
    get_libreria_protocolos_for_routing: "p_clerk_user_id",
    get_navegante_progress: "p_clerk_id",
    save_navegante_level: "p_clerk_id",
    clear_navegante_progress: "p_clerk_id",
    // Barrido profundo 2026-06-13: citas 1:1 propias. get_citas_1to1_de_tripulante
    // filtraba por clerk_user_id O email AMBOS forjables → cualquiera con la anon
    // key leía el zoom_join_url + zoom_password + email + intención de otro.
    // Ahora el id lo inyecta el gateway desde el token; el p_email se ignora.
    get_citas_1to1_de_tripulante: "p_clerk_user_id",
    // Telemetría de navegación: registra capa/sub-capa abierta (id inyectado).
    record_nav_event: "p_clerk_user_id",
    // Sella el recorrido del onboarding (registrado con un id anónimo del
    // aparato, ANTES de que existiera sesión) con la cuenta recién creada.
    // El id del Tripulante lo inyecta el gateway desde el token verificado.
    link_onb_to_user: "p_clerk_user_id",
    // Ritual Diario (chequeos diarios de alta frecuencia + Fotones).
    get_ritual_diario: "p_clerk_user_id",
    toggle_ritual: "p_clerk_user_id",
    set_ritual_config: "p_clerk_user_id",
    grant_sendero_bonus: "p_clerk_user_id",
    grant_plan_vuelo_bonus: "p_clerk_user_id",
    grant_contemplacion_bonus: "p_clerk_user_id",
    get_my_day_tasks: "p_clerk_user_id",
    upsert_day_task: "p_clerk_user_id",
    toggle_day_task: "p_clerk_user_id",
    move_day_task: "p_clerk_user_id",
    delete_day_task: "p_clerk_user_id",
    reorder_day_tasks: "p_clerk_user_id",
    // Afirmaciones del Ritual Diario: catálogo curado + selección + custom.
    get_ritual_afirmaciones: "p_clerk_user_id",
    set_ritual_afirmaciones_sel: "p_clerk_user_id",
    upsert_ritual_afirmacion_custom: "p_clerk_user_id",
    delete_ritual_afirmacion_custom: "p_clerk_user_id",
    // Ritual Personalizado del Sendero: la rutina que el Tripulante escribe.
    get_ritual_personalizado: "p_clerk_user_id",
    set_ritual_personalizado: "p_clerk_user_id",
    // Cámara de Cristalización (sumidero de Fotones: tienda de avatares +
    // elementos). Saldo gastable = Maestría (total de por vida) − lo gastado;
    // comprar NUNCA toca daily_checkins → la evolución del avatar no baja.
    get_crystal_chamber: "p_clerk_user_id",
    select_avatar: "p_clerk_user_id",
    purchase_crystal_item: "p_clerk_user_id",
    equip_crystal_element: "p_clerk_user_id",
    // Capa de Comunidad (Constelación de la Red): perfil público opt-in +
    // intereses + directorio. El id del caller se inyecta; el target del
    // detalle (p_target_clerk_id) viaja en params, no se sobrescribe.
    get_my_community_profile: "p_clerk_user_id",
    set_my_community_profile: "p_clerk_user_id",
    get_community_directory: "p_clerk_user_id",
    get_community_profile: "p_clerk_user_id",
    // Mensajería de Comunidad (DMs 1:1). El id del caller se inyecta; el target
    // (p_target_clerk_id) y el id de conversación (p_conversation_id) viajan en params.
    dm_start_conversation: "p_clerk_user_id",
    dm_send_message: "p_clerk_user_id",
    dm_get_my_conversations: "p_clerk_user_id",
    dm_get_messages: "p_clerk_user_id",
    dm_mark_read: "p_clerk_user_id",
    // Corazón del chat (doble toque, reversible): valida participante + que el
    // mensaje sea DEL OTRO server-side; el id del que reacciona lo inyecta el gateway.
    dm_react_message: "p_clerk_user_id",
    // Stickers (Parte 3): catálogo member-aware de paquetes de marca. Los packs
    // premium se desbloquean con Sintonía/Inmersión (locked=true si no es miembro);
    // el muro real lo aplica dm_send_message server-side. id inyectado por el gateway.
    get_sticker_catalog: "p_clerk_user_id",
    // Wallpapers: el catálogo se sirve member-aware → la URL full-res de los
    // fondos de paga (is_free=false) SOLO viaja a miembros (Sintonía/Inmersión);
    // los bloqueados llegan con image_url=null (tarjeta con candado, sin fuga).
    get_wallpapers: "p_clerk_user_id",
    // Telemetría de descargas de Anclajes Fotónicos: registra 1 guardado a Fotos
    // (el cliente manda solo p_wallpaper_id; el id del Tripulante lo inyecta el gateway).
    record_wallpaper_download: "p_clerk_user_id",
    // Notificaciones push: registra/quita el token APNs del dispositivo.
    register_push_token: "p_clerk_user_id",
    unregister_push_token: "p_clerk_user_id",
    // Preferencias de notificación (Ajustes → Notificaciones): qué push recibe
    // cada nodo ('crop_circles' · 'scan_weekly'; ausencia = encendido).
    get_my_notif_prefs: "p_clerk_user_id",
    set_my_notif_pref: "p_clerk_user_id",
    // ESPEJO · CONTEXTO VIVO (Fase 2): los interruptores del Tripulante sobre
    // qué ve el Espejo de su campo. `master_enabled` apaga TODA la ficha;
    // `dreams_enabled` (apagado de fábrica) es el consentimiento aparte para
    // los sueños. Las tres funciones del contexto son service_role-only (joya
    // de la corona: la ficha concentra el perfil entero de una persona) → el
    // id verificado lo inyecta este gateway. La FICHA en sí (get_espejo_context)
    // NO se rutea acá: la pide el edge oraculo-chat, que ya tiene service_role.
    get_espejo_context_prefs: "p_clerk_user_id",
    set_espejo_context_prefs: "p_clerk_user_id",
    // ESPEJO · FASE D (memoria destilada): "Olvidar todo" borra la ficha de
    // largo plazo (lo viejo no se re-aprende: las marcas quedan) y "Reescribir
    // desde cero" descarta ficha + marcas para que el cron la reconstruya
    // releyendo las charlas. La ficha en sí NUNCA se rutea acá: viaja dentro
    // de get_espejo_context (el edge oraculo-chat, service_role) y se muestra
    // por mode:"context". El destilador (espejo-destilador) también es
    // service_role puro.
    espejo_memoria_forget: "p_clerk_user_id",
    espejo_memoria_regenerate: "p_clerk_user_id",
    // Mensajería: total de no-leídos (badge de la card "Mensajes" en Mi Núcleo).
    dm_get_unread_count: "p_clerk_user_id",
    // Moderación de Comunidad: bloquear/desbloquear/reportar a otro Tripulante +
    // lista de a quién bloqueé. El id del que actúa lo inyecta el gateway; el
    // target (p_target_clerk_id) viaja en params.
    community_block_user: "p_clerk_user_id",
    community_unblock_user: "p_clerk_user_id",
    community_report_user: "p_clerk_user_id",
    get_my_blocks: "p_clerk_user_id",
    // Constelaciones de Maestría: medallas permanentes (métricas server-side).
    get_my_medals: "p_clerk_user_id",
    // Un solo latido: bundle de arranque del Núcleo (membresía + ritual +
    // medallas + no-leídos) en una sola llamada (cliente cachea + revalida).
    get_home_state: "p_clerk_user_id",
    // Ciudad de Luz (Simuladores): estado del cosmos por Tripulante. El idle
    // (luz pasiva) se computa server-side por delta; save acepta solo mutaciones
    // tipadas (ofrendar/sembrar/nutrir/colapsar/bitacora). 🜂 La economía es
    // CERRADA: nunca escribe en daily_checkins/Maestría/cristales (regla de oro).
    get_ciudad_luz: "p_clerk_user_id",
    save_ciudad_luz: "p_clerk_user_id",
    // Buzón de ideas/mejoras de la app. El id se inyecta verificado; si el
    // Tripulante marca "anónimo", la RPC NO lo guarda (clerk_user_id = NULL).
    submit_app_feedback: "p_clerk_user_id",
    // SOPORTE (Ajustes → "¿Necesitas ayuda?"): reporta un problema. Puerta
    // APARTE del buzón de ideas — un problema urgente no puede caer en la pila
    // de sugerencias. El correo de la cuenta lo resuelve la RPC server-side
    // contra profiles con el id verificado: el cliente no lo manda ni puede
    // mentirlo. Requiere migración 20260807_soporte.
    submit_support_ticket: "p_clerk_user_id",
    // El caso ES una conversación: el Tripulante ve su hilo, responde (reabre si
    // se había dado por resuelto) y apaga su punto de no leído. Vive en Ajustes,
    // aparte de los mensajes de Comunidad: un problema de cobro no puede caer
    // entre mensajes sociales. Requiere 20260807c_soporte_conversacion.
    get_my_support_tickets: "p_clerk_user_id",
    add_support_message: "p_clerk_user_id",
    mark_support_read: "p_clerk_user_id",
    // 🜂 AFINAMIENTO DEL ESPEJO: la marca de "esto no me representa" sobre un
    // reflejo, con el ángulo correcto si lo escribieron. Es el bucle de mejora
    // del Espejo, hermano del panel de Voz: la corrección se captura EN
    // CALIENTE, con el reflejo delante, y de ahí salen las leyes del prompt.
    // Requiere migración 20260813b_espejo_afinamiento.
    registrar_afinamiento_espejo: "p_clerk_user_id",
    // Telemetría: la app reporta su versión (profiles.app_version del propio nodo).
    set_app_version: "p_clerk_user_id",
    // Regalo de Sintonía: el Tripulante consulta si tiene un regalo pendiente y lo
    // acepta (al aceptar se activa la membresía de regalo). El id lo inyecta el gateway.
    get_my_pending_gift: "p_clerk_user_id",
    claim_gift_sintonia: "p_clerk_user_id",
    // Contador de RACHAS (capa del Radar): hábitos pasivos medidos en
    // automático. El límite freemium (1 libre / 30 con membresía) vive
    // server-side en create_racha; p_racha_id/p_title/p_started_at viajan
    // en params, el id del Tripulante lo inyecta el gateway.
    get_my_rachas: "p_clerk_user_id",
    create_racha: "p_clerk_user_id",
    reset_racha: "p_clerk_user_id",
    update_racha: "p_clerk_user_id",
    delete_racha: "p_clerk_user_id",
    toggle_racha_pause: "p_clerk_user_id",
    // BITÁCORA DE COHERENCIA (capa del Radar): cuaderno de notas. El límite
    // freemium (5 libres / ilimitado con membresía) vive server-side en
    // upsert_nota; p_id/p_title/p_body/p_tag/p_pinned/p_favorite viajan en
    // params, el id del Tripulante lo inyecta el gateway.
    get_my_notas: "p_clerk_user_id",
    upsert_nota: "p_clerk_user_id",
    delete_nota: "p_clerk_user_id",
    // SINCRONIZADOR DE ÓRBITAS (Simuladores): salas multi-dispositivo del
    // juego de interacción grupal. Crear sala = SOLO membresía activa (la
    // verdad vive server-side en create_orbita_room); unirse es libre para
    // cualquier Tripulante identificado. p_code/p_room_id/p_action/p_payload
    // viajan en params; el id del Tripulante lo inyecta el gateway.
    create_orbita_room: "p_clerk_user_id",
    join_orbita_room: "p_clerk_user_id",
    get_orbita_room: "p_clerk_user_id",
    orbita_room_action: "p_clerk_user_id",
    // REALIDAD ELEGIDA (vision board del Radar): la visión del Tripulante
    // (nombre + respuestas por ángulo + fotos) viaja CIFRADA en reposo
    // (pgcrypto + Vault). Crear la visión es libre; el freemium (3 fotos
    // libres / re-anclar solo miembros) vive server-side. p_angle_key /
    // p_pilar / p_prompt_custom / p_body / p_nombre / p_url / p_id viajan
    // en params; el id del Tripulante lo inyecta el gateway.
    get_my_vision: "p_clerk_user_id",
    upsert_vision_answer: "p_clerk_user_id",
    delete_vision_answer: "p_clerk_user_id",
    seal_vision: "p_clerk_user_id",
    add_vision_photo: "p_clerk_user_id",
    delete_vision_photo: "p_clerk_user_id",
    reanchor_vision: "p_clerk_user_id",
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405)
    }

    const body = await req.json().catch(() => ({}))

    const gate = await gateUser(body?.token)
    if (!gate.ok) {
        return json({ error: gate.error }, gate.status || 401)
    }

    const action = (body?.action || "").toString()
    if (!(action in USER_RPCS)) {
        return json({ error: "action_not_allowed" }, 400)
    }

    // Inyecta el id verificado; descarta el que venga del cliente.
    const params = { ...(body?.params || {}) }
    params[USER_RPCS[action]] = gate.userId

    const { data, error } = await supabase.rpc(action, params)
    if (error) {
        console.error(`[user-action] ${action} fail:`, error.message)
        return json({ error: error.message, code: error.code }, 400)
    }

    return json(data ?? null)
})
