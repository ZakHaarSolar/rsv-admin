-- Red Solar Viva · COMUNIDAD · Preferencia de vínculo (filtrable) + medallas en
-- el perfil público
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- (1) Preferencia de vínculo OPCIONAL en el perfil: 'amor' (abierto al amor) |
--     'amistad' (solo amistades) | NULL (sin preferencia). Se elige en Mi Firma
--     y se puede FILTRAR en la búsqueda del directorio (como los intereses).
-- (2) El perfil público (detalle + tarjeta de nodo del chat) muestra las
--     CONSTELACIONES DE MAESTRÍA del Tripulante (medallas), calculadas al vuelo
--     desde sus métricas reales (no depende de que haya abierto su propio panel).
--
-- Reproduce los cuerpos VIGENTES (20260621f con filtro de bloqueos/baneos +
-- 20260621c) y los extiende. Las firmas que cambian van con DROP+CREATE.

-- ── Columna ─────────────────────────────────────────────────────────
ALTER TABLE public.community_profiles
    ADD COLUMN IF NOT EXISTS relationship_pref text;
CREATE INDEX IF NOT EXISTS idx_community_profiles_pref
    ON public.community_profiles (relationship_pref);

-- ════════════════════════════════════════════════════════════════════
-- set_my_community_profile — suma p_relationship_pref (firma cambia → DROP+CREATE).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.set_my_community_profile(text, text, text, boolean, jsonb, date);
CREATE OR REPLACE FUNCTION public.set_my_community_profile(
    p_clerk_user_id text,
    p_alias    text,
    p_bio      text,
    p_visible  boolean,
    p_interests jsonb,
    p_birthdate date DEFAULT NULL,
    p_relationship_pref text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alias text := LEFT(TRIM(COALESCE(p_alias, '')), 40);
    v_bio   text := LEFT(TRIM(COALESCE(p_bio, '')), 160);
    v_vis   boolean := COALESCE(p_visible, false) AND length(v_alias) > 0;
    v_bd    date := CASE
        WHEN p_birthdate IS NULL THEN NULL
        WHEN p_birthdate > CURRENT_DATE THEN NULL
        WHEN p_birthdate < CURRENT_DATE - interval '120 years' THEN NULL
        ELSE p_birthdate
    END;
    -- Solo valores conocidos; cualquier otra cosa → NULL (sin preferencia).
    v_pref  text := CASE
        WHEN p_relationship_pref IN ('amor', 'amistad') THEN p_relationship_pref
        ELSE NULL
    END;
    result  json;
BEGIN
    INSERT INTO community_profiles (clerk_user_id, alias, bio, visible, birthdate, relationship_pref, updated_at)
    VALUES (p_clerk_user_id, v_alias, v_bio, v_vis, v_bd, v_pref, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET alias = EXCLUDED.alias,
            bio = EXCLUDED.bio,
            visible = EXCLUDED.visible,
            birthdate = EXCLUDED.birthdate,
            relationship_pref = EXCLUDED.relationship_pref,
            updated_at = now();

    DELETE FROM community_profile_interests WHERE clerk_user_id = p_clerk_user_id;
    IF p_interests IS NOT NULL AND jsonb_typeof(p_interests) = 'array' THEN
        INSERT INTO community_profile_interests (clerk_user_id, interest_key)
        SELECT p_clerk_user_id, sub.k
        FROM (
            SELECT DISTINCT ci.interest_key AS k
            FROM jsonb_array_elements_text(p_interests) AS e(k)
            JOIN community_interests ci ON ci.interest_key = e.k AND ci.active
            LIMIT 8
        ) sub
        ON CONFLICT (clerk_user_id, interest_key) DO NOTHING;
    END IF;

    SELECT json_build_object(
        'ok', true, 'alias', v_alias, 'bio', v_bio, 'visible', v_vis,
        'birthdate', v_bd, 'relationship_pref', v_pref,
        'interests', COALESCE((
            SELECT json_agg(interest_key ORDER BY interest_key)
            FROM community_profile_interests WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb, date, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb, date, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- get_my_community_profile — suma relationship_pref al retorno (misma firma).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_community_profile(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alias text; v_bio text; v_visible boolean; v_bd date; v_pref text;
    v_found boolean; result json;
BEGIN
    SELECT alias, bio, visible, birthdate, relationship_pref
    INTO v_alias, v_bio, v_visible, v_bd, v_pref
    FROM community_profiles WHERE clerk_user_id = p_clerk_user_id;
    v_found := FOUND;

    SELECT json_build_object(
        'has_profile', v_found,
        'alias',   COALESCE(v_alias, ''),
        'bio',     COALESCE(v_bio, ''),
        'visible', COALESCE(v_visible, false),
        'birthdate', v_bd,
        'relationship_pref', v_pref,
        'interests', COALESCE((
            SELECT json_agg(interest_key ORDER BY interest_key)
            FROM community_profile_interests WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object('key', interest_key, 'label', label)
                            ORDER BY sort_order, label)
            FROM community_interests WHERE active
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- get_community_directory — suma p_pref (filtro) + relationship_pref por perfil.
-- Firma cambia → DROP+CREATE. Conserva el filtro de bloqueos/baneos (20260621f).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.get_community_directory(text, text, integer, integer);
CREATE OR REPLACE FUNCTION public.get_community_directory(
    p_clerk_user_id text,
    p_interest text DEFAULT NULL,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0,
    p_pref text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    lim  int  := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 60);
    off  int  := GREATEST(COALESCE(p_offset, 0), 0);
    intf text := NULLIF(TRIM(COALESCE(p_interest, '')), '');
    prf  text := CASE WHEN p_pref IN ('amor', 'amistad') THEN p_pref ELSE NULL END;
    result json;
BEGIN
    WITH visibles AS (
        SELECT cp.clerk_user_id, cp.alias, cp.bio, cp.relationship_pref
        FROM community_profiles cp
        WHERE cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
          AND cp.clerk_user_id <> p_clerk_user_id
          AND NOT public._community_blocked(p_clerk_user_id, cp.clerk_user_id)
          AND NOT public._community_banned(cp.clerk_user_id)
          AND (prf IS NULL OR cp.relationship_pref = prf)
          AND (
            intf IS NULL
            OR EXISTS (
                SELECT 1 FROM community_profile_interests pi
                WHERE pi.clerk_user_id = cp.clerk_user_id AND pi.interest_key = intf
            )
          )
    ),
    enriched AS (
        SELECT
            v.clerk_user_id, v.alias, v.bio, v.relationship_pref,
            COALESCE(s.selected_avatar, 'nova') AS avatar_key,
            COALESCE(s.equipped, '{}'::jsonb)   AS equipped,
            COALESCE((
                SELECT SUM(dc.points) FROM daily_checkins dc
                WHERE dc.clerk_user_id = v.clerk_user_id AND dc.checkin_date < d_today
            ), 0)::int AS mastery
        FROM visibles v
        LEFT JOIN user_crystal_state s ON s.clerk_user_id = v.clerk_user_id
    ),
    page AS (
        SELECT
            e.clerk_user_id, e.alias, e.bio, e.relationship_pref,
            e.avatar_key, e.equipped, e.mastery,
            COALESCE((
                SELECT json_agg(pi.interest_key ORDER BY pi.interest_key)
                FROM community_profile_interests pi
                WHERE pi.clerk_user_id = e.clerk_user_id
            ), '[]'::json) AS interests
        FROM enriched e
        ORDER BY e.mastery DESC, e.alias ASC, e.clerk_user_id ASC
        LIMIT lim OFFSET off
    )
    SELECT json_build_object(
        'total', (SELECT COUNT(*) FROM enriched),
        'profiles', COALESCE(
            (SELECT json_agg(row_to_json(pg) ORDER BY pg.mastery DESC, pg.alias ASC, pg.clerk_user_id ASC) FROM page pg),
            '[]'::json
        ),
        'interests', COALESCE((
            SELECT json_agg(json_build_object('key', interest_key, 'label', label)
                            ORDER BY sort_order, label)
            FROM community_interests WHERE active
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

REVOKE EXECUTE ON FUNCTION public.get_community_directory(text, text, integer, integer, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_community_directory(text, text, integer, integer, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- get_community_profile — suma relationship_pref + medallas (al vuelo).
-- Misma firma. Conserva el filtro de bloqueos/baneos (20260621f) + scan/age (c).
-- ════════════════════════════════════════════════════════════════════
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
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_bd, v_pref, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND cp.visible
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> '';

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    -- Último escaneo COMPLETO (6/6) → Índice + 6 pilares.
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

    -- Métricas del Tripulante para las medallas (al vuelo, sin escribir).
    BEGIN
        SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
        FROM daily_checkins WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01';

        SELECT COUNT(*)::int INTO v_rituales
        FROM daily_checkins WHERE clerk_user_id = tgt AND activity_key <> 'admin_adjust';

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

    -- Medallas por constelación (desbloqueadas / total), calculadas al vuelo.
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
