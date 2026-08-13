-- Red Solar Viva · AUDITORÍA · PARTE 3 — cierres de la cola
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Independiente del archivo de cifrado (20260727_cifrado_intimo_*): se puede
-- pegar antes o después, en cualquier orden.
--
-- Contiene tres cosas, de más a menos urgente:
--   1) delete_nota_nodo_admin — abierta a anon, VERIFICADO EN VIVO. Se cierra.
--   2) BORRADO DE CUENTA COMPLETO (Apple 5.1.1) — hoy "eliminar mi cuenta" deja
--      38 tablas personales intactas, incluidas las cuatro que acabamos de cifrar.
--   3) DEDUPE DE WEBHOOKS — un reintento de Stripe crea una SEGUNDA sala de Zoom
--      real y vuelve a sumar el mismo pago a la facturación.
--
-- Los puntos 2 y 3 requieren además desplegar sus edges (ver el reporte).

-- =============================================================================
-- 1) delete_nota_nodo_admin — CERRAR
-- =============================================================================
-- Sonda en vivo con la sola llave pública (2026-07-27):
--     POST /rest/v1/rpc/delete_nota_nodo_admin  →  200 {"error":"not_admin"}
-- Es decir: anon PUEDE ejecutarla; lo único que la frena es que compara el
-- p_clerk_id que le mandan contra profiles.is_admin. Ese id es un parámetro
-- forjable y la Parte 1 ya documentó que un id de admin es descubrible, así que
-- el gate no es una barrera real. Borra notas del expediente de un nodo.
--
-- Es el MISMO patrón del hallazgo de la Parte 2: el lockdown del Observatorio
-- (20260613e) cerró 7 RPC y dejó fuera el BORRADO. Su gemela de escritura
-- (upsert_nota_nodo_admin) SÍ quedó cerrada — verificado en vivo, 401.
--
-- Cierre sin riesgo: no tiene NINGÚN caller. Grep repo-wide sobre Code/*.tsx y
-- sobre el whitelist de admin-action: cero. Es una RPC huérfana y destructiva.
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'delete_nota_nodo_admin'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
        RAISE NOTICE 'cerrada: %', r.sig;
    END LOOP;
END $$;

-- =============================================================================
-- 2) BORRADO DE CUENTA COMPLETO (App Store · Guideline 5.1.1(v))
-- =============================================================================
-- Hoy `delete-account` borra 11 tablas. Sobreviven 38 con datos personales,
-- entre ellas las MÁS íntimas de toda la app:
--   dream_records (el texto del sueño), bitacora_notas (el diario), rachas,
--   oraculo_messages + oraculo_conversations (el Espejo), vision_board/answers/
--   photos (la visión), matter_jobs (fotos de comida), community_profiles,
--   day_tasks, daily_checkins, push_tokens…
-- Es decir: acabamos de cifrar el contenido íntimo "para que un volcado no lo
-- lea", pero al pedir la baja ese mismo contenido se quedaba para siempre.
--
-- Esta RPC borra TODO lo personal en una sola llamada, tolerante a que alguna
-- tabla no exista (cada borrado va en su propio bloque: si una falla, las demás
-- siguen). Devuelve el conteo por tabla para que la edge lo registre.
--
-- SE CONSERVA A PROPÓSITO (y por qué):
--   · purchases / codice_purchase_ledger / reservas / payments_log / vtli_reservas
--       → registros FINANCIEROS. Ya era la política de delete-account (borra lo
--         personal, conserva lo contable). Un borrado aquí rompería la
--         contabilidad y la conciliación con Stripe.
--   · community_bans
--       → si se borra, un Tripulante baneado se registra de nuevo limpio. Es
--         moderación, no contenido personal.
--   · revenue_exclusions → configuración interna del panel, no del usuario.
CREATE OR REPLACE FUNCTION public.purge_my_account_data(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    -- Todas las tablas personales que hoy sobreviven, más las 9 que la edge ya
    -- borraba (repetirlas aquí es inofensivo y deja UNA sola fuente de verdad).
    v_tables text[] := ARRAY[
        -- lo que ya borraba la edge
        'scan_vibracional','sonda_progress','decoder_scans',
        'estado_tripulante_protocolos','cristales_extraccion','meditaciones_owned',
        'reading_progress','navegante_progress','email_dispatches',
        -- lo íntimo que quedaba fuera
        'bitacora_notas','rachas','dream_records','dream_scans',
        'oraculo_messages','oraculo_conversations','oraculo_usage',
        'vision_board','vision_answers','vision_photos','vision_versions',
        'vision_sessions','matter_jobs','crop_decodes',
        -- ritual, plan de vuelo y progreso
        'daily_checkins','daily_ritual_config','ritual_personalizado',
        'ritual_user_afirmaciones_custom','ritual_user_afirmaciones_sel',
        'day_tasks','medal_unlocks','user_crystal_owned','user_crystal_state',
        'ciudad_luz_estado',
        -- comunidad e identidad pública
        'community_profiles','community_profile_interests',
        -- avisos, telemetría y preferencias
        'push_tokens','notif_prefs','radar_ready_notified','nav_events',
        'wallpaper_downloads','voice_transcript_usage','app_feedback',
        'gift_offers','analisis_profundo'
    ];
    v_t       text;
    v_n       int;
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
            -- Una tabla con otra columna de dueño o con una FK no debe abortar
            -- el resto del borrado. Se reporta y se sigue.
            v_deleted := v_deleted || json_build_object('t', v_t, 'err', SQLERRM);
        END;
    END LOOP;

    -- Los mensajes privados: se borran los que ESTA persona envió. Los que
    -- recibió pertenecen también al otro participante, así que su conversación
    -- no se destruye; la identidad ya se anonimiza al borrar community_profiles.
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

    RETURN json_build_object('ok', true, 'total', v_total, 'detail', array_to_json(v_deleted));
END $$;

REVOKE ALL ON FUNCTION public.purge_my_account_data(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_my_account_data(text) TO service_role;

-- =============================================================================
-- 3) DEDUPE DE WEBHOOKS — que un reintento no duplique el efecto
-- =============================================================================
-- Stripe reintenta un evento hasta que recibe 2xx. Hoy ningún webhook recuerda
-- lo que ya procesó, así que un reintento:
--   · CREA UNA SEGUNDA SALA DE ZOOM REAL para la misma reserva
--   · vuelve a mandar el correo de confirmación
--   · vuelve a insertar en payments_log → el mismo pago cuenta DOS veces en la
--     facturación del panel (INSERT plano, sin ON CONFLICT)
--   · vuelve a insertar en subscription_periods y en el espejo exploration_passes
--
-- La cura es una sola línea al tope de cada webhook: si el event.id ya se vio,
-- responder 200 y no hacer nada. `webhook_event_seen` es atómica (el INSERT con
-- ON CONFLICT decide; no hay carrera posible entre dos reintentos simultáneos).
CREATE TABLE IF NOT EXISTS public.webhook_events (
    source       text NOT NULL,          -- 'stripe' | 'revenuecat' | 'clerk'
    event_id     text NOT NULL,
    processed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (source, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_at ON public.webhook_events (processed_at);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- (Sin policies → nadie la toca salvo service_role vía la RPC.)

-- Devuelve TRUE si es la PRIMERA vez que se ve este evento (hay que procesarlo)
-- y FALSE si es un reintento (hay que ignorarlo y responder 200).
CREATE OR REPLACE FUNCTION public.webhook_event_seen(
    p_source   text,
    p_event_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_first boolean;
BEGIN
    IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
        RETURN true;   -- sin id no podemos deduplicar: procesar (como hoy).
    END IF;
    INSERT INTO public.webhook_events (source, event_id)
    VALUES (COALESCE(NULLIF(trim(p_source), ''), 'desconocido'), trim(p_event_id))
    ON CONFLICT (source, event_id) DO NOTHING;
    GET DIAGNOSTICS v_first = ROW_COUNT;
    RETURN v_first;
EXCEPTION WHEN OTHERS THEN
    RETURN true;       -- fail-open: nunca bloquea un pago legítimo.
END $$;

REVOKE ALL ON FUNCTION public.webhook_event_seen(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.webhook_event_seen(text, text) TO service_role;

-- Higiene: los eventos de más de 90 días ya no se reintentan. Se limpian solos.
CREATE OR REPLACE FUNCTION public.purge_old_webhook_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
    DELETE FROM public.webhook_events WHERE processed_at < now() - interval '90 days';
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.purge_old_webhook_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_webhook_events() TO service_role;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICAR (opcional)
-- =============================================================================
--   SELECT public.webhook_event_seen('stripe','evt_prueba_1');  -- true  (1ª vez)
--   SELECT public.webhook_event_seen('stripe','evt_prueba_1');  -- false (reintento)
--   DELETE FROM public.webhook_events WHERE event_id = 'evt_prueba_1';
