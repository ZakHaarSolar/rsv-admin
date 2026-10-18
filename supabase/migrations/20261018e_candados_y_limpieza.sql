-- Red Solar Viva · CANDADOS Y LIMPIEZA (seguridad y retención, 2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Idempotente: se puede correr dos veces sin daño. Va después de
-- ✅ 20261018d_telemetria.sql (ya pegada).
--
-- Lo que salió al inventariar la telemetría, verificado en producción con
-- solo lectura el 2026-10-18:
--
-- (1) CANDADOS. Nueve funciones de administrador se podían llamar con la
--     llave pública: su único portón era «el id que manda quien llama es
--     admin», y el id de una cuenta no es secreto. La peor,
--     get_ia_gasto_por_nodo, devuelve el nombre y el gasto de IA de cada
--     persona; admin_grant_image_pass escribe. Todas ya pasan por
--     admin-action (que verifica la sesión) o nadie las llama: quedan solo
--     para el servidor. is_admin_caller se queda abierta porque la app de las
--     tiendas la llama directo (solo dice si un id es admin).
-- (2) FRENOS a lo que se escribe sin sesión: record_onb_step (cada id nuevo
--     era una «instalación» más en Motor → Campaña, sin tope) y
--     record_muro_evento_anon (el freno por apertura y por aparato se esquiva
--     inventando ids; faltaba uno global).
-- (3) LIMPIEZA DIARIA (pg_cron rsv-retencion-diaria, 04:40 de Cancún): el
--     registro de gasto, las descargas de fondos, los correos enviados, los
--     comentarios, la huella de lo borrado del Espejo y el historial del
--     propio pg_cron crecían para siempre; tres purgas que ya existían
--     (frases de voz, afinación del Espejo, avisos de webhooks) nunca se
--     programaron.
-- (4) BORRAR LA CUENTA borra lo que faltaba: el muro, el soporte, el vínculo
--     de la bienvenida, su rastro en el registro de gasto y seis tablas más.
--     purge_my_account_data copiada tal cual de producción (ya con el bloque
--     de la telemetría) y solo se suma lo que faltaba.
-- (5) PAGOS: una fila por factura en payments_log (índice único). Con
--     stripe-webhook v2.7, cada alta nueva de la web queda UNA vez.

-- ── (1) Candados: funciones de administrador solo para el servidor ────
DO $$
DECLARE
    r record;
    v_nombres text[] := ARRAY[
        'get_ia_gasto_por_nodo',            -- nombre y gasto de IA de cada persona
        'admin_get_image_pass',             -- pase de imágenes del Arquitecto (lee)
        'admin_grant_image_pass',           -- pase de imágenes del Arquitecto (escribe)
        'get_admin_stats',                  -- conteos de suscripciones (sin uso)
        'get_atelier_drafts_dashboard',     -- Atelier (sin uso)
        'group_suno_creations_into_album',  -- Frecuencias Sonoras (escribe)
        'set_vtli_draft_cover',             -- Atelier (escribe, sin uso)
        'set_vtli_keyframe_video',          -- Atelier (escribe, sin uso)
        'update_vtli_draft_status'          -- Atelier (escribe)
    ];
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS firma
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = ANY (v_nombres)
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.firma);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.firma);
    END LOOP;
END $$;

-- ── (2) Frenos a lo que se escribe sin sesión ────────────────────────

-- La bienvenida: copiada de producción con tres frenos nuevos.
CREATE INDEX IF NOT EXISTS idx_onb_funnel_started ON public.onb_funnel (started_at DESC);

CREATE OR REPLACE FUNCTION public.record_onb_step(
    p_anon     uuid,
    p_step     integer,
    p_platform text  DEFAULT NULL::text,
    p_answers  jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    -- Las respuestas que manda la app pesan menos de 300 caracteres
    -- (origin, q1 a q4, modo, codice); lo que no es un objeto chico no entra.
    v_answers jsonb := CASE
        WHEN jsonb_typeof(p_answers) = 'object' AND length(p_answers::text) <= 2000
            THEN p_answers
        ELSE '{}'::jsonb
    END;
BEGIN
    IF p_anon IS NULL OR p_step IS NULL OR p_step < 1 OR p_step > 20 THEN
        RETURN;
    END IF;
    /* Freno de inundación (2026-10-18): cada id nuevo es una instalación en
       Motor → Campaña. Más de 30 instalaciones nuevas en un minuto o 300 en
       una hora ya no es gente: la nueva se ignora en silencio. Las que ya
       empezaron siguen avanzando, y la app no se entera (no espera respuesta). */
    IF NOT EXISTS (SELECT 1 FROM public.onb_funnel WHERE anon_id = p_anon) AND (
        (SELECT count(*) FROM (
            SELECT 1 FROM public.onb_funnel
            WHERE started_at > now() - interval '1 minute' LIMIT 30) x) >= 30
        OR (SELECT count(*) FROM (
            SELECT 1 FROM public.onb_funnel
            WHERE started_at > now() - interval '1 hour' LIMIT 300) x) >= 300
    ) THEN
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
        v_answers
    )
    ON CONFLICT (anon_id) DO UPDATE
        SET max_step   = GREATEST(public.onb_funnel.max_step, EXCLUDED.max_step),
            completed  = public.onb_funnel.completed OR EXCLUDED.completed,
            -- Una instalación no junta respuestas sin fin: pasado el tope,
            -- se queda con las que ya tenía.
            answers    = CASE
                WHEN length((public.onb_funnel.answers || v_answers)::text) <= 4000
                    THEN public.onb_funnel.answers || v_answers
                ELSE public.onb_funnel.answers
            END,
            updated_at = now();
END $function$;

-- El muro sin sesión: un freno global antes del de cada apertura y aparato.
CREATE INDEX IF NOT EXISTS muro_eventos_sin_cuenta
    ON public.muro_eventos (created_at DESC) WHERE clerk_user_id IS NULL;

CREATE OR REPLACE FUNCTION public.record_muro_evento_anon(
    p_apertura    uuid,
    p_muro        text,
    p_evento      text,
    p_plan        text    DEFAULT NULL::text,
    p_motivo      text    DEFAULT NULL::text,
    p_miembro     boolean DEFAULT NULL::boolean,
    p_plataforma  text    DEFAULT NULL::text,
    p_version     text    DEFAULT NULL::text,
    p_detalle     jsonb   DEFAULT NULL::jsonb,
    p_dispositivo uuid    DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    /* Freno global (2026-10-18): sin sesión, el tope por apertura y por
       aparato se esquiva inventando ids. Más de 120 eventos sin cuenta en un
       minuto o 1,500 en una hora ya no es gente: se ignora en silencio. */
    IF (SELECT count(*) FROM (
            SELECT 1 FROM public.muro_eventos
            WHERE clerk_user_id IS NULL AND created_at > now() - interval '1 minute'
            LIMIT 120) x) >= 120
       OR (SELECT count(*) FROM (
            SELECT 1 FROM public.muro_eventos
            WHERE clerk_user_id IS NULL AND created_at > now() - interval '1 hour'
            LIMIT 1500) x) >= 1500 THEN
        RETURN;
    END IF;
    PERFORM public.record_muro_evento(
        NULL, p_apertura, p_muro, p_evento, p_plan, p_motivo, p_miembro,
        p_plataforma, p_version, p_detalle, p_dispositivo
    );
END $function$;

REVOKE ALL ON FUNCTION public.record_muro_evento_anon(uuid, text, text, text, text, boolean, text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_muro_evento_anon(uuid, text, text, text, text, boolean, text, text, jsonb, uuid)
    TO anon, authenticated, service_role;

-- ── (3) Limpieza diaria ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rsv_retencion_diaria()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_n   bigint;
    v_res jsonb := '{}'::jsonb;
BEGIN
    -- (a) Registro de gasto: 400 días, lo mismo que guarda la medición
    --     (_tele_reconstruir lee de ahí). Los cupos «-gratis» son regalos de
    --     por vida (las imágenes rápidas de la Matriz para quien no paga) y se
    --     cuentan con estas filas: esas no se borran, o el regalo empezaría de
    --     nuevo.
    BEGIN
        DELETE FROM public.edge_spend_ledger
        WHERE created_at < now() - interval '400 days'
          AND edge NOT LIKE '%-gratis';
        GET DIAGNOSTICS v_n = ROW_COUNT;
        v_res := v_res || jsonb_build_object('edge_spend_ledger', v_n);
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('edge_spend_ledger', SQLERRM);
    END;

    -- (b) Descargas de fondos: 400 días (la medición las lee igual).
    BEGIN
        DELETE FROM public.wallpaper_downloads
        WHERE created_at < now() - interval '400 days';
        GET DIAGNOSTICS v_n = ROW_COUNT;
        v_res := v_res || jsonb_build_object('wallpaper_downloads', v_n);
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('wallpaper_downloads', SQLERRM);
    END;

    -- (c) Correos enviados: 400 días. El candado contra correos repetidos
    --     mira 24 horas como mucho (is_recent_dispatch).
    BEGIN
        DELETE FROM public.email_dispatches
        WHERE created_at < now() - interval '400 days';
        GET DIAGNOSTICS v_n = ROW_COUNT;
        v_res := v_res || jsonb_build_object('email_dispatches', v_n);
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('email_dispatches', SQLERRM);
    END;

    -- (d) Comentarios de la app: dos años.
    BEGIN
        DELETE FROM public.app_feedback
        WHERE created_at < now() - interval '730 days';
        GET DIAGNOSTICS v_n = ROW_COUNT;
        v_res := v_res || jsonb_build_object('app_feedback', v_n);
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('app_feedback', SQLERRM);
    END;

    -- (e) Huella de lo borrado del Espejo: la ficha del nodo suma todo, así que
    --     lo de más de 400 días no se borra, se junta en UNA fila por persona
    --     (las sumas no cambian; solo deja de crecer).
    BEGIN
        WITH viejas AS (
            DELETE FROM public.oraculo_borrados
            WHERE borrado_at < now() - interval '400 days'
              AND clerk_user_id IN (
                  SELECT clerk_user_id FROM public.oraculo_borrados
                  WHERE borrado_at < now() - interval '400 days'
                  GROUP BY clerk_user_id HAVING count(*) > 1)
            RETURNING clerk_user_id, conversaciones, mensajes, borrado_at
        ), juntas AS (
            INSERT INTO public.oraculo_borrados (clerk_user_id, conversaciones, mensajes, borrado_at)
            SELECT clerk_user_id, sum(conversaciones), sum(mensajes), max(borrado_at)
            FROM viejas
            GROUP BY clerk_user_id
            RETURNING 1
        )
        SELECT count(*) INTO v_n FROM viejas;
        v_res := v_res || jsonb_build_object('oraculo_borrados_juntadas', v_n);
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('oraculo_borrados', SQLERRM);
    END;

    -- (f) Las tres purgas que ya existían y nunca se programaron.
    BEGIN
        IF to_regprocedure('public.purgar_voz_frases()') IS NOT NULL THEN
            v_res := v_res || jsonb_build_object('voz_frases_90d', public.purgar_voz_frases());
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('voz_frases', SQLERRM);
    END;
    BEGIN
        IF to_regprocedure('public.purgar_espejo_afinamiento()') IS NOT NULL THEN
            PERFORM public.purgar_espejo_afinamiento();
            v_res := v_res || jsonb_build_object('espejo_afinamiento_180d', 'ok');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('espejo_afinamiento', SQLERRM);
    END;
    BEGIN
        IF to_regprocedure('public.purge_old_webhook_events()') IS NOT NULL THEN
            v_res := v_res || jsonb_build_object('webhook_events_90d', public.purge_old_webhook_events());
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('webhook_events', SQLERRM);
    END;

    -- (g) El historial del propio pg_cron: tres trabajos cada 5 minutos lo
    --     llevaron a 119 mil filas (21 MB) desde abril. Dos semanas bastan
    --     para ver si algo falló.
    BEGIN
        IF to_regclass('cron.job_run_details') IS NOT NULL THEN
            DELETE FROM cron.job_run_details
            WHERE coalesce(end_time, start_time) < now() - interval '14 days';
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_res := v_res || jsonb_build_object('cron_historial_14d', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_res := v_res || jsonb_build_object('cron_historial', SQLERRM);
    END;

    RETURN v_res;
END $$;

REVOKE ALL ON FUNCTION public.rsv_retencion_diaria() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rsv_retencion_diaria() TO service_role;

-- Cada día a las 09:40 UTC (04:40 en Cancún), después de tele-mantener-diario.
-- Si pg_cron no está, no pasa nada.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule('rsv-retencion-diaria', '40 9 * * *',
                              'SELECT public.rsv_retencion_diaria();');
    END IF;
END $$;

-- ── (4) Borrar la cuenta borra lo que faltaba ─────────────────────────
-- purge_my_account_data copiada tal cual de producción (2026-10-18, ya con el
-- bloque de la telemetría): siete tablas más en la lista y un bloque nuevo
-- antes del final.
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
        'gift_offers','analisis_profundo',
        -- lo que faltaba (20261018e): cada vez que vio el muro, los mensajes
        -- que ocultó, los avisos del ciclo, las muestras de afinación del
        -- Espejo, la huella de lo que borró, su velocímetro de dictado y su
        -- pase de imágenes
        'muro_eventos','chat_mensajes_ocultos','ciclo_parcial_notified',
        'espejo_afinamiento','oraculo_borrados','dictado_records','ia_pase_imagen'
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

    -- 🜂 Lo que faltaba (20261018e_candados_y_limpieza): su soporte, el vínculo
    -- de su bienvenida, su rastro en el registro de gasto, sus bloqueos y la
    -- lista de espera de Android. Lo contable y lo de moderación se quedan.
    BEGIN
        -- Soporte: sus casos (los mensajes se van en cascada) y lo que la casa
        -- hizo en ellos, que guarda correos y el inicio de cada respuesta.
        IF to_regclass('public.support_tickets') IS NOT NULL THEN
            IF to_regclass('public.support_actions') IS NOT NULL THEN
                DELETE FROM public.support_actions
                WHERE ticket_id IN (SELECT id FROM public.support_tickets
                                    WHERE clerk_user_id = p_clerk_user_id);
            END IF;
            DELETE FROM public.support_tickets WHERE clerk_user_id = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', 'soporte', 'n', v_n);
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'soporte', 'err', SQLERRM);
    END;

    BEGIN
        -- Su bienvenida se queda como una instalación más, sin decir de quién:
        -- el embudo siempre fue anónimo y solo se suelta el vínculo.
        IF to_regclass('public.onb_funnel') IS NOT NULL THEN
            UPDATE public.onb_funnel SET clerk_user_id = NULL
            WHERE clerk_user_id = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_deleted := v_deleted || json_build_object('t', 'onb_funnel_sin_cuenta', 'n', v_n);
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'onb_funnel', 'err', SQLERRM);
    END;

    BEGIN
        -- El registro de gasto se queda sin dueño: lo que costó la IA sigue en
        -- los totales de cada mes y la medición ya no lo reconstruye a su nombre.
        IF to_regclass('public.edge_spend_ledger') IS NOT NULL THEN
            UPDATE public.edge_spend_ledger SET user_key = NULL, ip_key = NULL
            WHERE user_key = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_deleted := v_deleted || json_build_object('t', 'edge_spend_ledger_sin_cuenta', 'n', v_n);
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'edge_spend_ledger', 'err', SQLERRM);
    END;

    BEGIN
        -- A quién bloqueó y quién lo bloqueó (su id ya no existe).
        IF to_regclass('public.community_blocks') IS NOT NULL THEN
            DELETE FROM public.community_blocks
            WHERE blocker_clerk_id = p_clerk_user_id OR blocked_clerk_id = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', 'community_blocks', 'n', v_n);
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'community_blocks', 'err', SQLERRM);
    END;

    BEGIN
        -- La lista de espera de Android guarda solo el correo (corre antes de
        -- que delete-account borre el perfil, así que el correo todavía está).
        IF to_regclass('public.android_waitlist') IS NOT NULL THEN
            DELETE FROM public.android_waitlist w
            WHERE lower(w.email) IN (SELECT lower(p.email) FROM public.profiles p
                                     WHERE p.clerk_user_id = p_clerk_user_id
                                       AND p.email IS NOT NULL);
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', 'android_waitlist', 'n', v_n);
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'android_waitlist', 'err', SQLERRM);
    END;

    RETURN json_build_object('ok', true, 'total', v_total, 'detail', array_to_json(v_deleted));
END $function$;

REVOKE ALL ON FUNCTION public.purge_my_account_data(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_my_account_data(text) TO service_role;

-- ── (5) Pagos: una fila por factura ───────────────────────────────────
-- Cada alta nueva de la web se anotaba DOS veces en payments_log: el checkout
-- insertaba una fila sin factura y invoice.payment_succeeded no la encontraba
-- e insertaba otra (el Motor suma las dos). Hoy no hay ninguna repetida (la
-- última alta por la web fue el 2026-05-20), así que no se toca ninguna fila:
-- desde stripe-webhook v2.7 el checkout anota la factura y este índice
-- garantiza que una misma factura no entre dos veces. Las filas sin factura
-- (libros y altas viejas) no cuentan para el índice.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.payments_log
        WHERE stripe_invoice_id IS NOT NULL
        GROUP BY stripe_invoice_id
        HAVING count(*) > 1
    ) THEN
        RAISE NOTICE 'payments_log ya tiene facturas repetidas: el índice único no se crea (revisar a mano).';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS payments_log_una_por_factura
            ON public.payments_log (stripe_invoice_id);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- La primera limpieza, para ver que todo responde (lo normal hoy: el historial
-- de pg_cron baja unas 107 mil filas y todo lo demás sale en cero).
SELECT public.rsv_retencion_diaria() AS limpieza;
