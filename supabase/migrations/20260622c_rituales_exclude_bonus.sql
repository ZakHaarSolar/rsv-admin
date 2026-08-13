-- Red Solar Viva · MEDALLAS · Excluir el bono del Sendero del conteo de 'rituales'
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- (Correr DESPUES de 20260622_community_photo.sql y 20260622b_sendero_bonus.sql.)
--
-- El check-in 'sendero_bonus' (premio por completar el sendero) NO es un ritual
-- cumplido por el Tripulante. La metrica 'rituales' de las Constelaciones de
-- Maestria (Pulso del Ritual) lo excluye ahora, igual que 'admin_adjust', en
-- get_my_medals y en el perfil publico (get_community_profile). Reproduce los
-- cuerpos VIGENTES con el unico cambio en el filtro de v_rituales.

CREATE OR REPLACE FUNCTION public.get_my_medals(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_total    int := 0;   -- Maestría (días cerrados)
    v_streak   int := 0;
    v_dias     int := 0;
    v_rituales int := 0;
    v_etapa    int := 1;
    v_av       text;
    v_th       jsonb;
    v_new      json;
    result     json;
BEGIN
    SELECT COALESCE(SUM(points), 0)::int INTO v_total
    FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date < d_today;

    SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date <> DATE '2000-01-01';

    SELECT COUNT(*)::int INTO v_rituales
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND activity_key NOT IN ('admin_adjust', 'sendero_bonus');

    -- Racha actual (corrida consecutiva que termina en hoy o ayer).
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

    -- Etapa del avatar seleccionado (mastery vs sus umbrales).
    SELECT selected_avatar INTO v_av FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    v_av := COALESCE(v_av, 'nova');
    SELECT thresholds INTO v_th FROM avatar_config WHERE avatar_key = v_av;
    v_th := COALESCE(v_th, '[0,50,250,800,2000,5000,12000]'::jsonb);
    SELECT GREATEST(COUNT(*), 1)::int INTO v_etapa
    FROM jsonb_array_elements_text(v_th) t WHERE v_total >= (t::numeric);

    -- Registrar medallas recién cruzadas (permanentes). RETURNING = las nuevas.
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
                'label', mc.label,
                'subtitle', mc.subtitle,
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
                        'label', mt.label,
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

CREATE OR REPLACE FUNCTION public.get_community_profile(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    tgt text := COALESCE(p_target_clerk_id, '');
    v_alias text; v_bio text; v_avatar text; v_equipped jsonb; v_mastery int;
    v_bd date; v_pref text;
    v_show boolean; v_photo text;
    v_scan json;
    v_streak int := 0; v_dias int := 0; v_rituales int := 0; v_etapa int := 1;
    v_th jsonb;
    v_medals json;
    result json;
BEGIN
    IF public._community_blocked(p_clerk_user_id, tgt) OR public._community_banned(tgt) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT
        cp.alias, cp.bio, cp.birthdate, cp.relationship_pref,
        cp.show_photo, cp.photo_url,
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_bd, v_pref, v_show, v_photo, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND cp.visible
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> '';

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT json_build_object(
        'indice', sv.indice_silicio, 'fisico', sv.hardware_fisico,
        'mental', sv.procesador_mental, 'emocional', sv.motor_emocional,
        'financiero', sv.gravedad_financiera, 'vector', sv.vector_expansion,
        'orbita', sv.orbita_relacional, 'scanned_at', sv.created_at
    ) INTO v_scan
    FROM scan_vibracional sv
    WHERE sv.clerk_user_id = tgt
      AND sv.cycle_scanned_json LIKE '%"fisico"%'
      AND sv.cycle_scanned_json LIKE '%"mental"%'
      AND sv.cycle_scanned_json LIKE '%"emocional"%'
      AND sv.cycle_scanned_json LIKE '%"financiero"%'
      AND sv.cycle_scanned_json LIKE '%"vector"%'
      AND sv.cycle_scanned_json LIKE '%"orbita"%'
    ORDER BY sv.created_at DESC
    LIMIT 1;

    BEGIN
        SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
        FROM daily_checkins WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01';

        SELECT COUNT(*)::int INTO v_rituales
        FROM daily_checkins WHERE clerk_user_id = tgt AND activity_key NOT IN ('admin_adjust', 'sendero_bonus');

        WITH d AS (
            SELECT DISTINCT checkin_date AS cd FROM daily_checkins
            WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01' AND checkin_date <= d_today
        ),
        g AS (SELECT cd, (cd - (ROW_NUMBER() OVER (ORDER BY cd))::int) AS grp FROM d)
        SELECT CASE
            WHEN (SELECT MAX(cd) FROM d) IS NULL OR (SELECT MAX(cd) FROM d) < d_today - 1 THEN 0
            ELSE (SELECT COUNT(*) FROM g WHERE grp = (SELECT grp FROM g ORDER BY cd DESC LIMIT 1))::int
        END INTO v_streak;
        v_streak := COALESCE(v_streak, 0);

        SELECT thresholds INTO v_th FROM avatar_config WHERE avatar_key = v_avatar;
        v_th := COALESCE(v_th, '[0,50,250,800,2000,5000,12000]'::jsonb);
        SELECT GREATEST(COUNT(*), 1)::int INTO v_etapa
        FROM jsonb_array_elements_text(v_th) t WHERE v_mastery >= (t::numeric);
    EXCEPTION WHEN OTHERS THEN
        v_streak := 0; v_dias := 0; v_rituales := 0; v_etapa := 1;
    END;

    SELECT COALESCE(json_agg(json_build_object(
        'key', mc.constelacion_key, 'label', mc.label, 'glyph', mc.glyph_key,
        'accent', mc.accent,
        'total', (SELECT COUNT(*) FROM medal_tiers mt WHERE mt.constelacion_key = mc.constelacion_key),
        'unlocked', (
            SELECT COUNT(*) FROM medal_tiers mt
            WHERE mt.constelacion_key = mc.constelacion_key
              AND (CASE mc.metric
                    WHEN 'fotones'      THEN v_mastery
                    WHEN 'racha'        THEN v_streak
                    WHEN 'dias_activos' THEN v_dias
                    WHEN 'rituales'     THEN v_rituales
                    WHEN 'etapa'        THEN v_etapa
                    ELSE 0 END) >= mt.threshold
        )
    ) ORDER BY mc.sort_order, mc.label), '[]'::json)
    INTO v_medals
    FROM medal_constelaciones mc WHERE mc.active;

    SELECT json_build_object(
        'clerk_user_id', tgt, 'alias', v_alias, 'bio', v_bio,
        'avatar_key', v_avatar, 'equipped', v_equipped, 'mastery', v_mastery,
        'relationship_pref', v_pref,
        'photo', CASE WHEN COALESCE(v_show, false) AND v_photo IS NOT NULL THEN v_photo ELSE NULL END,
        'age', CASE WHEN v_bd IS NULL THEN NULL ELSE date_part('year', age(v_bd))::int END,
        'scan', v_scan,
        'medals', v_medals,
        'interests', COALESCE((
            SELECT json_agg(json_build_object('key', ci.interest_key, 'label', ci.label)
                            ORDER BY ci.sort_order, ci.label)
            FROM community_profile_interests pi
            JOIN community_interests ci ON ci.interest_key = pi.interest_key
            WHERE pi.clerk_user_id = tgt
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label, 'params', params
            ) ORDER BY kind, sort_order, label)
            FROM crystal_catalog WHERE active
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

NOTIFY pgrst, 'reload schema';
