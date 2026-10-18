-- Lo que hay en producción ANTES de 20261018e (2026-10-18): solo las columnas de las
-- tablas que toca la migración (sin datos) y las funciones tal como estaban, con sus
-- permisos. Sacado con pg_get_functiondef por la API de gestión (solo lectura).
CREATE TABLE public.profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), clerk_user_id text, email text, full_name text, is_admin boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE public.onb_funnel (anon_id uuid PRIMARY KEY, max_step integer DEFAULT 0, completed boolean DEFAULT false, platform text, started_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), answers jsonb DEFAULT '{}'::jsonb, clerk_user_id text);
CREATE TABLE public.muro_eventos (id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(), clerk_user_id text, dispositivo uuid, apertura uuid, muro text, evento text, plan text, motivo text, miembro boolean, plataforma text, version text, detalle jsonb DEFAULT '{}'::jsonb);
CREATE INDEX muro_eventos_apertura ON public.muro_eventos (apertura);
CREATE TABLE public.edge_spend_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_key text, ip_key text, edge text, cost_units integer DEFAULT 1, created_at timestamptz DEFAULT now());
CREATE TABLE public.wallpaper_downloads (id bigserial PRIMARY KEY, clerk_user_id text, wallpaper_id uuid, created_at timestamptz DEFAULT now());
CREATE TABLE public.email_dispatches (id bigserial PRIMARY KEY, clerk_user_id text, email text, email_type text, status text, error_message text, metadata jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE public.app_feedback (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), clerk_user_id text, message text, anonymous boolean DEFAULT false, status text DEFAULT 'nuevo', created_at timestamptz DEFAULT now());
CREATE TABLE public.oraculo_borrados (id bigserial PRIMARY KEY, clerk_user_id text NOT NULL, conversaciones int NOT NULL DEFAULT 0, mensajes int NOT NULL DEFAULT 0, borrado_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.voz_frases_sin_resolver (id bigserial PRIMARY KEY, texto text NOT NULL, lang text NOT NULL DEFAULT 'es', familia text, contexto jsonb NOT NULL DEFAULT '{}', quien_hash text, creado_en timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.espejo_afinamiento (id bigserial PRIMARY KEY, clerk_user_id text, carril text DEFAULT 'matriz', prompt text, reflejo text, angulo text, lang text DEFAULT 'es', estado text DEFAULT 'nueva', creado_en timestamptz DEFAULT now());
CREATE TABLE public.webhook_events (source text NOT NULL, event_id text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.payments_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, email text, stripe_payment_intent_id text, stripe_invoice_id text, payment_type text, description text, amount_cents integer, currency text DEFAULT 'usd', status text DEFAULT 'succeeded', paid_at timestamptz DEFAULT now(), stripe_subscription_id text, stripe_hosted_invoice_url text, updated_at timestamptz DEFAULT now());
CREATE TABLE public.support_tickets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), clerk_user_id text, email text, kind text DEFAULT 'otro', message text DEFAULT '', fields jsonb DEFAULT '{}', status text DEFAULT 'nuevo', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE public.support_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE, autor text, body text, admin_clerk_id text, read_at timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE public.support_actions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL, admin_clerk_id text, action text, target_ref text, detalle jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE public.community_blocks (blocker_clerk_id text NOT NULL, blocked_clerk_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.android_waitlist (email text NOT NULL, source text NOT NULL DEFAULT 'app', locale text, created_at timestamptz NOT NULL DEFAULT now(), notified_at timestamptz);
CREATE TABLE public.chat_mensajes_ocultos (clerk_user_id text NOT NULL, tipo text NOT NULL, message_id bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.ciclo_parcial_notified (clerk_user_id text NOT NULL, cycle_ts timestamptz NOT NULL, etapa smallint NOT NULL, notified_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.dictado_records (id bigserial PRIMARY KEY, clerk_user_id text NOT NULL, ppm int NOT NULL, palabras int NOT NULL, segundos int NOT NULL, fidelidad int, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.ia_pase_imagen (clerk_user_id text NOT NULL, dia date NOT NULL, extra integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.scan_vibracional (id uuid DEFAULT gen_random_uuid(), clerk_user_id text, created_at timestamptz DEFAULT now());
CREATE TABLE public.nav_events (id uuid DEFAULT gen_random_uuid(), clerk_user_id text, layer text, created_at timestamptz DEFAULT now());
CREATE TABLE public.tele_dias (persona text, dia date, sesiones int);
CREATE TABLE public.tele_uso (persona text, dia date, funcion text);
CREATE TABLE public.tele_respuestas (persona text, dia date);
CREATE TABLE public.tele_personas (persona text);
CREATE TABLE public.tele_aparatos (aparato uuid, clerk_user_id text);
CREATE TABLE public.suscripcion_eventos (tipo text, clerk_user_id text, evento_id text);
CREATE SCHEMA cron;
CREATE TABLE cron.job_run_details (runid bigserial PRIMARY KEY, jobid bigint, status text, start_time timestamptz, end_time timestamptz);

CREATE OR REPLACE FUNCTION public.record_onb_step(p_anon uuid, p_step integer, p_platform text DEFAULT NULL::text, p_answers jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF p_anon IS NULL OR p_step IS NULL OR p_step < 1 OR p_step > 20 THEN
        RETURN;
    END IF;
    /* Purga oportunista (~2% de los inserts): retención 120 días. */
    IF random() < 0.02 THEN
        DELETE FROM public.onb_funnel
        WHERE updated_at < now() - interval '120 days';
    END IF;
    INSERT INTO public.onb_funnel (anon_id, max_step, completed, platform, answers)
    VALUES (
        p_anon,
        p_step,
        -- 13 = llegó al paywall. El 14 (exprés) NO es "completó el paywall".
        p_step = 13,
        left(coalesce(p_platform, ''), 12),
        COALESCE(p_answers, '{}'::jsonb)
    )
    ON CONFLICT (anon_id) DO UPDATE
        SET max_step   = GREATEST(public.onb_funnel.max_step, EXCLUDED.max_step),
            completed  = public.onb_funnel.completed OR EXCLUDED.completed,
            answers    = public.onb_funnel.answers || COALESCE(p_answers, '{}'::jsonb),
            updated_at = now();
END $function$;

CREATE OR REPLACE FUNCTION public.record_muro_evento(p_clerk_user_id text, p_apertura uuid, p_muro text, p_evento text, p_plan text DEFAULT NULL::text, p_motivo text DEFAULT NULL::text, p_miembro boolean DEFAULT NULL::boolean, p_plataforma text DEFAULT NULL::text, p_version text DEFAULT NULL::text, p_detalle jsonb DEFAULT NULL::jsonb, p_dispositivo uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_cuenta  text := NULLIF(left(btrim(coalesce(p_clerk_user_id, '')), 64), '');
    v_detalle jsonb := coalesce(p_detalle, '{}'::jsonb);
BEGIN
    IF p_apertura IS NULL
       OR p_muro IS NULL OR p_muro !~ '^[a-z_]{2,32}$'
       OR p_evento IS NULL
       OR p_evento NOT IN ('visto', 'plan', 'intento', 'compra', 'cancelada',
                           'error', 'cerrado', 'motivo', 'restaurado') THEN
        RETURN;
    END IF;
    IF jsonb_typeof(v_detalle) <> 'object' OR length(v_detalle::text) > 1500 THEN
        v_detalle := '{}'::jsonb;
    END IF;

    /* Freno de inundación: una apertura no tiene 60 eventos, ni una cuenta
       o un aparato 500 en un día. Pasado eso, se ignora en silencio. */
    IF (SELECT count(*) FROM public.muro_eventos WHERE apertura = p_apertura) >= 60 THEN
        RETURN;
    END IF;
    IF v_cuenta IS NOT NULL AND (
        SELECT count(*) FROM public.muro_eventos
        WHERE clerk_user_id = v_cuenta AND created_at > now() - interval '1 day'
    ) >= 500 THEN
        RETURN;
    END IF;
    IF v_cuenta IS NULL AND p_dispositivo IS NOT NULL AND (
        SELECT count(*) FROM public.muro_eventos
        WHERE dispositivo = p_dispositivo AND created_at > now() - interval '1 day'
    ) >= 500 THEN
        RETURN;
    END IF;

    /* Purga oportunista (~1 % de las escrituras): un año de historia. */
    IF random() < 0.01 THEN
        DELETE FROM public.muro_eventos WHERE created_at < now() - interval '365 days';
    END IF;

    INSERT INTO public.muro_eventos (
        clerk_user_id, dispositivo, apertura, muro, evento, plan, motivo,
        miembro, plataforma, version, detalle
    ) VALUES (
        v_cuenta,
        p_dispositivo,
        p_apertura,
        p_muro,
        p_evento,
        CASE WHEN p_plan IN ('weekly', 'monthly') THEN p_plan END,
        CASE WHEN p_evento = 'motivo' AND p_motivo ~ '^[a-z_]{2,24}$' THEN p_motivo END,
        p_miembro,
        NULLIF(left(coalesce(p_plataforma, ''), 24), ''),
        NULLIF(left(coalesce(p_version, ''), 24), ''),
        v_detalle
    );
END $function$;

CREATE OR REPLACE FUNCTION public.record_muro_evento_anon(p_apertura uuid, p_muro text, p_evento text, p_plan text DEFAULT NULL::text, p_motivo text DEFAULT NULL::text, p_miembro boolean DEFAULT NULL::boolean, p_plataforma text DEFAULT NULL::text, p_version text DEFAULT NULL::text, p_detalle jsonb DEFAULT NULL::jsonb, p_dispositivo uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT public.record_muro_evento(
        NULL, p_apertura, p_muro, p_evento, p_plan, p_motivo, p_miembro,
        p_plataforma, p_version, p_detalle, p_dispositivo
    );
$function$;

CREATE OR REPLACE FUNCTION public.purge_my_account_data(p_clerk_user_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_tables text[] := ARRAY[
        -- lo que ya borraba la edge
        'scan_vibracional','sonda_progress','decoder_scans',
        'estado_tripulante_protocolos','cristales_extraccion','meditaciones_owned',
        'reading_progress','navegante_progress','email_dispatches',
        -- lo íntimo que quedaba fuera
        'bitacora_notas','rachas','dream_records','dream_scans',
        'oraculo_messages','oraculo_conversations','oraculo_usage',
        'espejo_memoria','espejo_context_prefs',
        'vision_board','vision_answers','vision_photos','vision_versions',
        'vision_sessions','matter_jobs','crop_decodes',
        -- ritual, plan de vuelo y progreso
        'daily_checkins','daily_ritual_config','ritual_personalizado',
        'ritual_user_afirmaciones_custom','ritual_user_afirmaciones_sel',
        'day_tasks','medal_unlocks','user_crystal_owned','user_crystal_state',
        'ciudad_luz_estado',
        -- comunidad e identidad pública
        'community_profiles','community_profile_interests',
        -- grupos y notas compartidas (2026-09-21)
        'bitacora_nota_members','grp_hearts',
        -- avisos, telemetría y preferencias
        'push_tokens','notif_prefs','radar_ready_notified','nav_events',
        'wallpaper_downloads','voice_transcript_usage','app_feedback',
        'gift_offers','analisis_profundo'
    ];
    v_t       text;
    v_n       int;
    v_gid     bigint;
    v_deleted json[] := '{}';
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    FOREACH v_t IN ARRAY v_tables LOOP
        BEGIN
            IF to_regclass('public.' || quote_ident(v_t)) IS NULL THEN
                CONTINUE;
            END IF;
            EXECUTE format(
                'DELETE FROM public.%I WHERE clerk_user_id = $1', v_t
            ) USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', v_t, 'n', v_n);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_deleted := v_deleted || json_build_object('t', v_t, 'err', SQLERRM);
        END;
    END LOOP;

    BEGIN
        IF to_regclass('public.dm_messages') IS NOT NULL THEN
            EXECUTE 'DELETE FROM public.dm_messages WHERE sender_clerk_id = $1'
                USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'err', SQLERRM);
    END;

    -- Grupos: sus mensajes se van, su lugar se libera y el grupo sigue con
    -- los demás (si se queda sin administrador, lo es el más antiguo; si se
    -- queda sin nadie, desaparece).
    BEGIN
        IF to_regclass('public.grp_members') IS NOT NULL THEN
            DELETE FROM public.grp_messages WHERE sender_clerk_id = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            DELETE FROM public.grp_invites
            WHERE inviter_id = p_clerk_user_id OR invitee_id = p_clerk_user_id;
            FOR v_gid IN
                SELECT group_id FROM public.grp_members WHERE clerk_user_id = p_clerk_user_id
            LOOP
                DELETE FROM public.grp_members
                WHERE group_id = v_gid AND clerk_user_id = p_clerk_user_id;
                PERFORM public._grp_fix_admins(v_gid);
            END LOOP;
            v_deleted := v_deleted || json_build_object('t', 'grupos', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'grupos', 'err', SQLERRM);
    END;

    BEGIN
        IF to_regclass('public.bitacora_nota_invites') IS NOT NULL THEN
            DELETE FROM public.bitacora_nota_invites
            WHERE inviter_id = p_clerk_user_id OR invitee_id = p_clerk_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'bitacora_nota_invites', 'err', SQLERRM);
    END;

    -- 🜂 La medición mes con mes (20261018d_telemetria): sus días, su uso, sus
    -- respuestas y su persona se van; sus aparatos y los eventos de la tienda se
    -- quedan sin cuenta (solo números, para que los totales no cambien).
    BEGIN
        IF to_regclass('public.tele_dias') IS NOT NULL THEN
            DELETE FROM public.tele_dias WHERE persona = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            DELETE FROM public.tele_uso WHERE persona = p_clerk_user_id;
            DELETE FROM public.tele_respuestas WHERE persona = p_clerk_user_id;
            DELETE FROM public.tele_personas WHERE persona = p_clerk_user_id;
            DELETE FROM public.tele_aparatos WHERE clerk_user_id = p_clerk_user_id;
            UPDATE public.suscripcion_eventos SET clerk_user_id = NULL
            WHERE clerk_user_id = p_clerk_user_id;
            v_deleted := v_deleted || json_build_object('t', 'telemetria', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'telemetria', 'err', SQLERRM);
    END;

    RETURN json_build_object('ok', true, 'total', v_total, 'detail', array_to_json(v_deleted));
END $function$;

CREATE OR REPLACE FUNCTION public.purgar_voz_frases()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_n int;
BEGIN
    DELETE FROM public.voz_frases_sin_resolver
    WHERE creado_en < now() - interval '90 days';
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $function$;

CREATE OR REPLACE FUNCTION public.purgar_espejo_afinamiento()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.espejo_afinamiento
    WHERE creado_en < now() - interval '180 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_old_webhook_events()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE n int;
BEGIN
    DELETE FROM public.webhook_events WHERE processed_at < now() - interval '90 days';
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END $function$;

CREATE OR REPLACE FUNCTION public.get_ia_gasto_por_nodo(p_clerk_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_is_admin boolean;
    v_rows     jsonb;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM profiles
    WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not_admin';
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.usd_30 DESC), '[]'::jsonb)
      INTO v_rows
    FROM (
        SELECT
            l.user_key,
            COALESCE(MAX(p.full_name), '')                                                                                     AS nombre,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'    AND l.created_at > now() - interval '1 day'),  0)::int AS refl_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'    AND l.created_at > now() - interval '7 days'), 0)::int AS refl_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'),                                                 0)::int AS refl_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision' AND l.created_at > now() - interval '1 day'),  0)::int AS vis_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision' AND l.created_at > now() - interval '7 days'), 0)::int AS vis_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision'),                                              0)::int AS vis_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'  AND l.created_at > now() - interval '1 day'),  0)::int AS img_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'  AND l.created_at > now() - interval '7 days'), 0)::int AS img_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'),                                               0)::int AS img_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga' AND l.created_at > now() - interval '1 day'),  0)::int AS raf_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga' AND l.created_at > now() - interval '7 days'), 0)::int AS raf_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga'),                                              0)::int AS raf_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '1 day'),  0)::int AS voz_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '7 days'), 0)::int AS voz_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),                                              0)::int AS voz_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'),                       0)::int AS deco_30,
            -- NUEVO · destilador de memoria del Espejo
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-memoria'),                                              0)::int AS mem_30,
            -- NUEVO · intérprete de los comandos por voz
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'voz-intent'),                                                  0)::int AS cmd_30,
            ROUND((
                COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'),           0) * 0.0025
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision'),        0) * 0.01
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'),         0) * 0.03
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga'),  0) * 0.003
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),        0) * 0.0156
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'), 0) * 0.004
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-memoria'),        0) * 0.0025
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'voz-intent'),            0) * 0.001
            )::numeric, 4)                                                                                                    AS usd_30
        FROM edge_spend_ledger l
        LEFT JOIN profiles p ON p.clerk_user_id = l.user_key
        WHERE l.user_key IS NOT NULL
          AND l.created_at > now() - interval '30 days'
        GROUP BY l.user_key
        ORDER BY usd_30 DESC
        LIMIT 300
    ) t;

    RETURN jsonb_build_object('nodos', v_rows, 'generado', now());
END;
$function$;


-- Las otras ocho funciones de administrador: mismas firmas, mismo portón, cuerpo mínimo.
CREATE FUNCTION public.admin_get_image_pass(p_clerk_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN IF NOT coalesce((SELECT is_admin FROM profiles WHERE clerk_user_id = p_clerk_id), false) THEN RAISE EXCEPTION 'not_admin'; END IF; RETURN '{"extra":0,"base":2}'::jsonb; END $f$;
CREATE FUNCTION public.admin_grant_image_pass(p_clerk_id text, p_n integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN IF NOT coalesce((SELECT is_admin FROM profiles WHERE clerk_user_id = p_clerk_id), false) THEN RAISE EXCEPTION 'not_admin'; END IF; RETURN '{"ok":true}'::jsonb; END $f$;
CREATE FUNCTION public.get_admin_stats(p_clerk_id text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN '{}'::json; END $f$;
CREATE FUNCTION public.get_atelier_drafts_dashboard(p_admin_clerk_id text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN '{}'::json; END $f$;
CREATE FUNCTION public.group_suno_creations_into_album(p_admin_clerk_id text, p_creation_ids uuid[], p_title text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN '{}'::json; END $f$;
CREATE FUNCTION public.set_vtli_draft_cover(p_admin_clerk_id text, p_draft_id uuid, p_cover_url text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN '{}'::json; END $f$;
CREATE FUNCTION public.set_vtli_keyframe_video(p_admin_clerk_id text, p_keyframe_id uuid, p_video_r2_url text, p_source text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN '{}'::json; END $f$;
CREATE FUNCTION public.update_vtli_draft_status(p_admin_clerk_id text, p_draft_id uuid, p_new_status text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN '{}'::json; END $f$;
CREATE FUNCTION public.is_admin_caller(p_clerk_user_id text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$ BEGIN RETURN json_build_object('is_admin', coalesce((SELECT is_admin FROM profiles WHERE clerk_user_id = p_clerk_user_id), false)); END $f$;

-- Permisos como en producción (2026-10-18).
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT p.oid::regprocedure AS f, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.f);
        IF r.proname IN ('get_ia_gasto_por_nodo','admin_get_image_pass','admin_grant_image_pass','get_admin_stats','get_atelier_drafts_dashboard',
                         'group_suno_creations_into_album','set_vtli_draft_cover','set_vtli_keyframe_video','update_vtli_draft_status','is_admin_caller',
                         'record_onb_step','record_muro_evento_anon') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.f);
        ELSE
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.f);
        END IF;
    END LOOP;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
