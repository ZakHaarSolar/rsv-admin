-- Red Solar Viva · Barrido profundo 2026-06-13 · Batch 2 — REVOKE de la familia Atelier/marketing
-- =====================================================================
-- 44 RPC SECURITY DEFINER de los paneles de marketing (AtelierMarketing /
-- AT_SomaCero / AT_ZakHaarCarrusel / AT_EstudioManual) estaban GRANT … TO anon
-- y gateadas SÓLO por un p_admin_clerk_id forjable. Con el id admin descubierto
-- (is_admin_caller) un anónimo podía leer/borrar prompts, drafts, posts, videos
-- y carruseles de marketing (datos confidenciales de negocio, no PII de usuario).
-- Ahora se invocan SÓLO por el gateway verificado `admin-action` v1.7 (el helper
-- rpc() de cada panel rutea por ahí; el id admin lo inyecta el server).
--
-- ⚠️ ORDEN: correr SOLO después de (a) desplegar `admin-action` v1.7 y
-- (b) confirmar que el Atelier (los 4 sub-paneles) carga por el gateway. Todas
-- WEB-ONLY (iOS no las llama) → sin dependencia del build iOS.

DO $$
DECLARE
    r record;
    names text[] := ARRAY[
        'get_atelier_dashboard','get_atelier_banners_dashboard','get_atelier_video_dashboard',
        'get_recent_vtli_posts','get_recent_vtli_drafts','get_recent_vtli_banners','get_recent_vtli_videos',
        'get_recent_soma_posts','get_soma_atelier_dashboard','get_soma_posts_by_ids',
        'get_zakhaar_carousels_admin',
        'get_vtli_colectivos','get_vtli_colectivos_admin','get_vtli_ambientes','get_vtli_ambientes_admin',
        'get_vtli_atelier_voices',
        'get_vtli_posts_by_ids','get_vtli_drafts_by_ids','get_vtli_banners_by_ids','get_vtli_videos_by_ids',
        'delete_vtli_post','delete_vtli_draft','delete_vtli_banner','delete_vtli_video',
        'delete_vtli_ambiente','delete_vtli_colectivo','delete_vtli_atelier_voice',
        'delete_soma_post','delete_zakhaar_carousel',
        'set_vtli_post_published','set_vtli_draft_published','set_vtli_draft_narration_takes',
        'set_vtli_ambiente_active','set_vtli_colectivo_active',
        'set_soma_post_published','set_zakhaar_carousel_published',
        'update_vtli_post_status','update_vtli_draft_narration','update_vtli_banner_status','update_vtli_video_status',
        'update_soma_post_status',
        'upsert_vtli_colectivo','upsert_vtli_ambiente','upsert_vtli_atelier_voice'
    ];
BEGIN
    FOR r IN
        SELECT p.proname,
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(names)
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;',
            r.proname, r.args
        );
        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role;',
            r.proname, r.args
        );
        RAISE NOTICE 'locked: %(%)', r.proname, r.args;
    END LOOP;
END $$;
