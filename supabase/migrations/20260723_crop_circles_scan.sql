-- 20260723_crop_circles_scan.sql — Detección automática diaria de Crop Circles
--
-- Soporte de base de datos para el cron `crop-circles-scan` (edge nueva) que
-- barre la web (cropcircleconnector.com primario + temporarytemples.co.uk) y
-- deja BORRADORES para que Zak revise y publique con un toque desde el Motor.
--
-- 1) crop_circles.source_slug  → clave de origen (ej. 'ccc:zeals/zeals2026a.html')
--    con índice UNIQUE parcial → idempotencia del cron (no re-agrega lo mismo).
-- 2) scan_crop_context()        → contexto barato para el pre-filtro del edge
--    (slugs ya vistos + formaciones recientes) antes del trabajo caro. service_role.
-- 3) scan_insert_crop_circle_draft(...) → inserta un BORRADOR con dedupe autoritativo
--    (por source_slug Y por sitio normalizado + fecha cercana → no duplica lo que
--    ya está en la siembra/panel). is_published=false. service_role.
-- 4) _notify_admins_new_crops(p_count, p_sample) → push SOLO a los admins
--    (profiles.is_admin) con token: "◉ N crop circles nuevos para revisar". service_role.
--
-- Pegar COMPLETO en Supabase Dashboard → SQL Editor → New Query → Run.
-- El cron (pg_cron) va al final, comentado: se activa cuando la edge esté
-- desplegada y el secreto CROP_SCAN_SECRET seteado (ver instrucciones abajo).

-- ─────────────────────────────────────────────────────────────────────
-- 1) source_slug + índice UNIQUE parcial (múltiples NULL permitidos)
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.crop_circles
    ADD COLUMN IF NOT EXISTS source_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crop_circles_source_slug
    ON public.crop_circles (source_slug)
    WHERE source_slug IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────
-- 2) Contexto para el pre-filtro del edge (evita detail-fetch + Gemini de lo ya visto)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.scan_crop_context()
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'slugs', COALESCE(
            (SELECT json_agg(source_slug) FROM crop_circles WHERE source_slug IS NOT NULL),
            '[]'::json),
        'recent', COALESCE(
            (SELECT json_agg(json_build_object(
                's', lower(regexp_replace(split_part(location_name, ',', 1), '[^a-zA-Z0-9]+', '', 'g')),
                'd', event_date))
             FROM crop_circles
             WHERE event_date >= (CURRENT_DATE - INTERVAL '150 days')),
            '[]'::json)
    );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 3) Inserta un BORRADOR con dedupe autoritativo
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.scan_insert_crop_circle_draft(
    p_source_slug   text,
    p_title         text,
    p_location_name text,
    p_country       text,
    p_lat           double precision,
    p_lng           double precision,
    p_event_date    date,
    p_pattern_kind  text,
    p_decoded_es    text,
    p_decoded_en    text,
    p_image_url     text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row   crop_circles%ROWTYPE;
    v_kind  text;
    v_site  text;
BEGIN
    -- Idempotencia del cron: ya insertamos exactamente esta formación.
    IF p_source_slug IS NOT NULL AND EXISTS (
        SELECT 1 FROM crop_circles WHERE source_slug = p_source_slug
    ) THEN
        RETURN json_build_object('inserted', false, 'reason', 'slug_exists');
    END IF;

    -- Dedupe cruzado (siembra / panel / otra fuente): sitio normalizado
    -- (parte antes de la 1ª coma, sin puntuación) que se contiene con uno
    -- ya guardado + fecha a ±4 días. Guard de longitud ≥4 para no matchear
    -- tokens triviales.
    v_site := lower(regexp_replace(split_part(COALESCE(p_location_name, ''), ',', 1),
                                   '[^a-zA-Z0-9]+', '', 'g'));
    IF length(v_site) >= 4 AND EXISTS (
        SELECT 1 FROM crop_circles cc
        WHERE abs(cc.event_date - p_event_date) <= 4
          AND (
            strpos(lower(regexp_replace(split_part(cc.location_name, ',', 1),
                                        '[^a-zA-Z0-9]+', '', 'g')), v_site) > 0
            OR strpos(v_site, lower(regexp_replace(split_part(cc.location_name, ',', 1),
                                                   '[^a-zA-Z0-9]+', '', 'g'))) > 0
          )
    ) THEN
        RETURN json_build_object('inserted', false, 'reason', 'dup_site_date');
    END IF;

    v_kind := CASE WHEN p_pattern_kind IN ('mandala','spiral','grid','orbits','web','tri')
                   THEN p_pattern_kind ELSE 'mandala' END;

    INSERT INTO crop_circles
        (title, location_name, country, lat, lng, event_date, pattern_kind,
         decoded_es, decoded_en, image_url, is_published, source_slug)
    VALUES
        (COALESCE(NULLIF(trim(COALESCE(p_title, '')), ''), 'Crop Circle'),
         COALESCE(p_location_name, ''), COALESCE(p_country, 'Reino Unido'),
         COALESCE(p_lat, 51.4), COALESCE(p_lng, -1.8),
         COALESCE(p_event_date, CURRENT_DATE), v_kind,
         COALESCE(p_decoded_es, ''), COALESCE(p_decoded_en, ''),
         p_image_url, false, p_source_slug)
    RETURNING * INTO v_row;

    RETURN json_build_object('inserted', true, 'id', v_row.id);
EXCEPTION WHEN unique_violation THEN
    -- Carrera: otro disparo insertó el mismo source_slug entremedio.
    RETURN json_build_object('inserted', false, 'reason', 'slug_race');
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4) Push SOLO a los admins (revisión de borradores)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._notify_admins_new_crops(
    p_count  integer,
    p_sample text
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r      record;
    n_sent int := 0;
    v_body text;
BEGIN
    IF COALESCE(p_count, 0) <= 0 THEN RETURN 0; END IF;

    v_body := CASE
        WHEN p_count = 1 THEN COALESCE(p_sample, 'Un crop circle') || '. Revísalo y publícalo desde el Motor.'
        ELSE p_count || ' crop circles nuevos (' || COALESCE(p_sample, '') || '). Revísalos y publícalos desde el Motor.'
    END;

    FOR r IN
        SELECT DISTINCT pt.clerk_user_id
        FROM push_tokens pt
        JOIN profiles p ON p.clerk_user_id = pt.clerk_user_id
        WHERE COALESCE(p.is_admin, false) = true
    LOOP
        BEGIN
            PERFORM public._push_dispatch(
                r.clerk_user_id,
                '◉ Crop circles nuevos para revisar',
                v_body,
                jsonb_build_object('type', 'admin_crop_scan')
            );
            n_sent := n_sent + 1;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    RETURN n_sent;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Permisos (patrón de la casa: solo service_role las ejecuta)
-- ─────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.scan_crop_context()                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.scan_insert_crop_circle_draft(text, text, text, text, double precision, double precision, date, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._notify_admins_new_crops(integer, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.scan_crop_context()                    TO service_role;
GRANT EXECUTE ON FUNCTION public.scan_insert_crop_circle_draft(text, text, text, text, double precision, double precision, date, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public._notify_admins_new_crops(integer, text) TO service_role;

NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════
-- CRON DIARIO — pegar SÓLO después de:
--   (a) desplegar la edge:  supabase functions deploy crop-circles-scan --no-verify-jwt
--   (b) setear el secreto:  supabase secrets set CROP_SCAN_SECRET="<una-cadena-larga-al-azar>"
-- Requiere las extensiones pg_cron + pg_net (Dashboard → Database → Extensions).
-- Corre 14:10 UTC (~8am hora de México). Reemplaza <CROP_SCAN_SECRET> por el
-- MISMO valor del secreto de arriba.
-- ═════════════════════════════════════════════════════════════════════
--
-- SELECT cron.schedule(
--     'crop-circles-scan-daily',
--     '10 14 * * *',
--     $cron$
--     SELECT net.http_post(
--         url     := 'https://cobtsltrcsruzcusyqhi.supabase.co/functions/v1/crop-circles-scan',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'x-cron-secret', '<CROP_SCAN_SECRET>'
--         ),
--         body    := jsonb_build_object('source', 'cron'),
--         timeout_milliseconds := 120000
--     );
--     $cron$
-- );
--
-- Para quitarlo:  SELECT cron.unschedule('crop-circles-scan-daily');
-- Para ver los jobs:  SELECT * FROM cron.job;
