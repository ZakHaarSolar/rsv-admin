-- 20260704b_i18n_read_rpcs.sql
-- FASE 3 i18n — LECTURAS por idioma. Cada función de lectura acepta p_lang
-- ('es'|'en', default 'es') y devuelve la columna _en cuando existe, con RESPALDO
-- al español si está vacía → nunca un hueco. El gateway user-action reenvía p_lang
-- solo (ya inyecta el clerk_user_id), así que NO se toca. Requiere las columnas _en
-- de 20260704_i18n_content_en_columns.sql.
--
-- Patrón de respaldo:  CASE WHEN p_lang='en' THEN COALESCE(NULLIF(x_en,''), x) ELSE x END
-- Las member-gated cambian de firma (añaden p_lang) → DROP + CREATE + re-afirmar
-- grants. Las públicas de wallpapers NO cambian de firma: devuelven title_en/name_en
-- ADEMÁS del español y el cliente elige (evita tocar el gateway paramless).
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

-- ════════════════════════════════════════════════════════════════════
-- 1) get_libreria_protocolos — Calibraciones (catálogo). Member-gated.
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_libreria_protocolos(text);
CREATE FUNCTION public.get_libreria_protocolos(
    p_clerk_user_id text,
    p_lang text DEFAULT 'es'
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tier text;
    v_is_admin boolean;
    v_en boolean := (p_lang = 'en');
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id LIMIT 1;

    v_tier := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier');

    IF NOT COALESCE(v_is_admin, false)
       AND v_tier NOT IN ('sintonia', 'inmersion') THEN
        RETURN '[]'::json;
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT id, pilar, fase, score_min, score_max,
                   CASE WHEN v_en THEN COALESCE(NULLIF(titulo_en, ''), titulo) ELSE titulo END AS titulo,
                   CASE WHEN v_en THEN COALESCE(NULLIF(descripcion_corta_en, ''), descripcion_corta) ELSE descripcion_corta END AS descripcion_corta,
                   CASE WHEN v_en THEN COALESCE(NULLIF(alerta_text_en, ''), alerta_text) ELSE alerta_text END AS alerta_text,
                   CASE WHEN v_en THEN COALESCE(NULLIF(sugerencia_text_en, ''), sugerencia_text) ELSE sugerencia_text END AS sugerencia_text,
                   CASE WHEN v_en THEN COALESCE(tareas_json_en, tareas_json) ELSE tareas_json END AS tareas_json,
                   is_active
            FROM public.libreria_protocolos
            WHERE is_active = true
            ORDER BY pilar ASC, fase ASC
        ) t
    );
END $$;
REVOKE ALL ON FUNCTION public.get_libreria_protocolos(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_libreria_protocolos(text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 2) get_libreria_protocolos_for_routing — Calibraciones del Enrutador.
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_libreria_protocolos_for_routing(text, text, int);
CREATE FUNCTION public.get_libreria_protocolos_for_routing(
    p_clerk_user_id text,
    p_pilar text,
    p_score int,
    p_lang text DEFAULT 'es'
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tier text;
    v_is_admin boolean;
    v_en boolean := (p_lang = 'en');
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id LIMIT 1;

    v_tier := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier');

    IF NOT COALESCE(v_is_admin, false)
       AND v_tier NOT IN ('sintonia', 'inmersion') THEN
        RETURN '[]'::json;
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT id, pilar, fase, score_min, score_max,
                   CASE WHEN v_en THEN COALESCE(NULLIF(titulo_en, ''), titulo) ELSE titulo END AS titulo,
                   CASE WHEN v_en THEN COALESCE(NULLIF(descripcion_corta_en, ''), descripcion_corta) ELSE descripcion_corta END AS descripcion_corta,
                   CASE WHEN v_en THEN COALESCE(NULLIF(alerta_text_en, ''), alerta_text) ELSE alerta_text END AS alerta_text,
                   CASE WHEN v_en THEN COALESCE(NULLIF(sugerencia_text_en, ''), sugerencia_text) ELSE sugerencia_text END AS sugerencia_text,
                   CASE WHEN v_en THEN COALESCE(tareas_json_en, tareas_json) ELSE tareas_json END AS tareas_json,
                   is_active
            FROM public.libreria_protocolos
            WHERE pilar = p_pilar AND is_active = true AND score_min <= p_score
            ORDER BY score_min ASC
        ) t
    );
END $$;
REVOKE ALL ON FUNCTION public.get_libreria_protocolos_for_routing(text, text, int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_libreria_protocolos_for_routing(text, text, int, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 3) get_ritual_diario — catálogo de rituales (label) + afirmaciones elegidas.
--    Las afirmaciones CUSTOM del usuario NO se traducen (son suyas).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_ritual_diario(text, text);
CREATE FUNCTION public.get_ritual_diario(
    p_clerk_user_id text,
    p_date text DEFAULT NULL,
    p_lang text DEFAULT 'es'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d        date := COALESCE(p_date::date, (now() AT TIME ZONE 'America/Cancun')::date);
    streak   integer := 0;
    cur      date;
    v_en     boolean := (p_lang = 'en');
    result   json;
BEGIN
    cur := d;
    IF NOT EXISTS (SELECT 1 FROM daily_checkins
                   WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur) THEN
        cur := cur - 1;
    END IF;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM daily_checkins
                              WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur);
        streak := streak + 1;
        cur := cur - 1;
    END LOOP;

    SELECT json_build_object(
        'date', d::text,
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'label', CASE WHEN v_en THEN COALESCE(NULLIF(label_en, ''), label) ELSE label END,
                'points', points,
                'requires_text', requires_text,
                'sort_order', sort_order
            ) ORDER BY sort_order)
            FROM daily_ritual_catalog WHERE active
        ), '[]'::json),
        'config', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'enabled', enabled,
                'sort_order', sort_order
            ) ORDER BY sort_order)
            FROM daily_ritual_config WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'today', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'note', note,
                'points', points
            ))
            FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d
        ), '[]'::json),
        'today_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d
        ), 0),
        'total_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id
        ), 0),
        'streak', streak,
        'afirmaciones_chosen', COALESCE((
            SELECT json_agg(json_build_object('kind', kind, 'id', id, 'texto', texto)
                   ORDER BY ord, texto)
            FROM (
                SELECT 'cat'::text AS kind, a.id::text AS id,
                       CASE WHEN v_en THEN COALESCE(NULLIF(a.texto_en, ''), a.texto) ELSE a.texto END AS texto,
                       (c.sort_order * 1000 + a.sort_order) AS ord
                FROM ritual_user_afirmaciones_sel s
                JOIN ritual_afirmaciones a ON a.id = s.afirmacion_id AND a.active
                JOIN ritual_afirmacion_categorias c ON c.id = a.categoria_id AND c.active
                WHERE s.clerk_user_id = p_clerk_user_id
                UNION ALL
                SELECT 'custom'::text, cu.id::text, cu.texto, 1000000
                FROM ritual_user_afirmaciones_custom cu
                WHERE cu.clerk_user_id = p_clerk_user_id AND cu.selected
            ) q
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_ritual_diario(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ritual_diario(text, text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 4) get_ritual_afirmaciones — catálogo del selector (categorías + textos).
--    Las CUSTOM del usuario NO se traducen.
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_ritual_afirmaciones(text);
CREATE FUNCTION public.get_ritual_afirmaciones(
    p_clerk_user_id text,
    p_lang text DEFAULT 'es'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_en boolean := (p_lang = 'en');
    result json;
BEGIN
    SELECT json_build_object(
        'categorias', COALESCE((
            SELECT json_agg(json_build_object(
                'id', c.id,
                'nombre', CASE WHEN v_en THEN COALESCE(NULLIF(c.nombre_en, ''), c.nombre) ELSE c.nombre END,
                'sort_order', c.sort_order,
                'afirmaciones', COALESCE((
                    SELECT json_agg(json_build_object(
                        'id', a.id,
                        'texto', CASE WHEN v_en THEN COALESCE(NULLIF(a.texto_en, ''), a.texto) ELSE a.texto END
                    ) ORDER BY a.sort_order, a.created_at)
                    FROM ritual_afirmaciones a
                    WHERE a.categoria_id = c.id AND a.active
                ), '[]'::json)
            ) ORDER BY c.sort_order, c.created_at)
            FROM ritual_afirmacion_categorias c WHERE c.active
        ), '[]'::json),
        'selected_ids', COALESCE((
            SELECT json_agg(s.afirmacion_id)
            FROM ritual_user_afirmaciones_sel s
            JOIN ritual_afirmaciones a ON a.id = s.afirmacion_id AND a.active
            WHERE s.clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'custom', COALESCE((
            SELECT json_agg(json_build_object(
                'id', id, 'texto', texto, 'selected', selected
            ) ORDER BY created_at)
            FROM ritual_user_afirmaciones_custom
            WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_ritual_afirmaciones(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ritual_afirmaciones(text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 5) get_my_medals — métricas + medallas. Localiza label/subtitle de la
--    constelación y label del tier. La lógica de registro (INSERT en
--    medal_unlocks) queda IDÉNTICA.
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_my_medals(text);
CREATE FUNCTION public.get_my_medals(
    p_clerk_user_id text,
    p_lang text DEFAULT 'es'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_total    int := 0;
    v_streak   int := 0;
    v_dias     int := 0;
    v_rituales int := 0;
    v_etapa    int := 1;
    v_av       text;
    v_th       jsonb;
    v_new      json;
    v_en       boolean := (p_lang = 'en');
    result     json;
BEGIN
    SELECT COALESCE(SUM(points), 0)::int INTO v_total
    FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date < d_today;

    SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date <> DATE '2000-01-01';

    SELECT COUNT(*)::int INTO v_rituales
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND activity_key <> 'admin_adjust';

    WITH d AS (
        SELECT DISTINCT checkin_date AS cd
        FROM daily_checkins
        WHERE clerk_user_id = p_clerk_user_id
          AND checkin_date <> DATE '2000-01-01'
          AND checkin_date <= d_today
    ),
    g AS (
        SELECT cd, (cd - (ROW_NUMBER() OVER (ORDER BY cd))::int) AS grp FROM d
    )
    SELECT CASE
        WHEN (SELECT MAX(cd) FROM d) IS NULL OR (SELECT MAX(cd) FROM d) < d_today - 1 THEN 0
        ELSE (SELECT COUNT(*) FROM g WHERE grp = (SELECT grp FROM g ORDER BY cd DESC LIMIT 1))::int
    END INTO v_streak;
    v_streak := COALESCE(v_streak, 0);

    SELECT selected_avatar INTO v_av FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    v_av := COALESCE(v_av, 'nova');
    SELECT thresholds INTO v_th FROM avatar_config WHERE avatar_key = v_av;
    v_th := COALESCE(v_th, '[0,50,250,800,2000,5000,12000]'::jsonb);
    SELECT GREATEST(COUNT(*), 1)::int INTO v_etapa
    FROM jsonb_array_elements_text(v_th) t WHERE v_total >= (t::numeric);

    WITH mv(metric, val) AS (
        VALUES ('fotones', v_total), ('racha', v_streak), ('dias_activos', v_dias),
               ('rituales', v_rituales), ('etapa', v_etapa)
    ),
    ins AS (
        INSERT INTO medal_unlocks (clerk_user_id, constelacion_key, tier_index)
        SELECT p_clerk_user_id, mc.constelacion_key, mt.tier_index
        FROM medal_tiers mt
        JOIN medal_constelaciones mc ON mc.constelacion_key = mt.constelacion_key AND mc.active
        JOIN mv ON mv.metric = mc.metric
        WHERE mv.val >= mt.threshold
        ON CONFLICT DO NOTHING
        RETURNING constelacion_key, tier_index
    )
    SELECT COALESCE(json_agg(json_build_object(
        'constelacion_key', constelacion_key, 'tier_index', tier_index
    )), '[]'::json) INTO v_new FROM ins;

    SELECT json_build_object(
        'metrics', json_build_object(
            'fotones', v_total, 'racha', v_streak, 'dias_activos', v_dias,
            'rituales', v_rituales, 'etapa', v_etapa
        ),
        'new_unlocks', v_new,
        'constelaciones', COALESCE((
            SELECT json_agg(json_build_object(
                'key', mc.constelacion_key,
                'label', CASE WHEN v_en THEN COALESCE(NULLIF(mc.label_en, ''), mc.label) ELSE mc.label END,
                'subtitle', CASE WHEN v_en THEN COALESCE(NULLIF(mc.subtitle_en, ''), mc.subtitle) ELSE mc.subtitle END,
                'glyph', mc.glyph_key,
                'metric', mc.metric,
                'accent', mc.accent,
                'value', (CASE mc.metric
                    WHEN 'fotones'      THEN v_total
                    WHEN 'racha'        THEN v_streak
                    WHEN 'dias_activos' THEN v_dias
                    WHEN 'rituales'     THEN v_rituales
                    WHEN 'etapa'        THEN v_etapa
                    ELSE 0 END),
                'tiers', COALESCE((
                    SELECT json_agg(json_build_object(
                        'tier_index', mt.tier_index,
                        'label', CASE WHEN v_en THEN COALESCE(NULLIF(mt.label_en, ''), mt.label) ELSE mt.label END,
                        'threshold', mt.threshold,
                        'unlocked', (mu.clerk_user_id IS NOT NULL),
                        'unlocked_at', mu.unlocked_at
                    ) ORDER BY mt.tier_index)
                    FROM medal_tiers mt
                    LEFT JOIN medal_unlocks mu
                        ON mu.clerk_user_id = p_clerk_user_id
                       AND mu.constelacion_key = mt.constelacion_key
                       AND mu.tier_index = mt.tier_index
                    WHERE mt.constelacion_key = mc.constelacion_key
                ), '[]'::json)
            ) ORDER BY mc.sort_order, mc.label)
            FROM medal_constelaciones mc WHERE mc.active
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_medals(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_medals(text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 6) get_wallpapers — PÚBLICA. NO cambia de firma: devuelve title_en ADEMÁS
--    de title; el cliente elige por idioma. (Evita tocar el gateway paramless.)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_wallpapers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'id', id, 'title', title, 'title_en', title_en, 'image_url', image_url,
        'is_free', is_free, 'sort_order', sort_order, 'category_id', category_id
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result FROM wallpapers WHERE active;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_wallpapers() TO anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 7) get_wallpaper_categories — PÚBLICA. Devuelve name_en ADEMÁS de name.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_wallpaper_categories()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'id', id, 'name', name, 'name_en', name_en, 'sort_order', sort_order
    ) ORDER BY sort_order, name), '[]'::json)
    INTO result FROM wallpaper_categories WHERE active;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_wallpaper_categories() TO anon, authenticated, service_role;
