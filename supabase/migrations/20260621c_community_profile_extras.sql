-- Red Solar Viva · COMUNIDAD · Extras del perfil — edad (fecha de nacimiento) +
-- puntaje del Escáner (Índice de Luz + 6 pilares) en el detalle de un perfil
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- (1) Fecha de nacimiento OPCIONAL en community_profiles → la EDAD se calcula
--     (no se vence al pasar un año). El detalle de OTRO perfil muestra la edad
--     (no la fecha exacta, por privacidad); mi propio perfil sí trae la fecha
--     (para editarla).
-- (2) get_community_profile devuelve, además, el ÚLTIMO escaneo COMPLETO del
--     Tripulante: el Índice de Luz + los 6 pilares (para mostrarlo en su perfil
--     y desglosarlo al tocarlo).

-- ── Fecha de nacimiento ─────────────────────────────────────────────
ALTER TABLE public.community_profiles
    ADD COLUMN IF NOT EXISTS birthdate date;

-- ════════════════════════════════════════════════════════════════════
-- set_my_community_profile — suma p_birthdate (cambia la firma → DROP+CREATE).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.set_my_community_profile(text, text, text, boolean, jsonb);
CREATE OR REPLACE FUNCTION public.set_my_community_profile(
    p_clerk_user_id text,
    p_alias    text,
    p_bio      text,
    p_visible  boolean,
    p_interests jsonb,
    p_birthdate date DEFAULT NULL
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
    -- Sanidad: una fecha futura o absurda (>120 años) se descarta a NULL.
    v_bd    date := CASE
        WHEN p_birthdate IS NULL THEN NULL
        WHEN p_birthdate > CURRENT_DATE THEN NULL
        WHEN p_birthdate < CURRENT_DATE - interval '120 years' THEN NULL
        ELSE p_birthdate
    END;
    result  json;
BEGIN
    INSERT INTO community_profiles (clerk_user_id, alias, bio, visible, birthdate, updated_at)
    VALUES (p_clerk_user_id, v_alias, v_bio, v_vis, v_bd, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET alias = EXCLUDED.alias,
            bio = EXCLUDED.bio,
            visible = EXCLUDED.visible,
            birthdate = EXCLUDED.birthdate,
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
        'ok', true,
        'alias', v_alias,
        'bio', v_bio,
        'visible', v_vis,
        'birthdate', v_bd,
        'interests', COALESCE((
            SELECT json_agg(interest_key ORDER BY interest_key)
            FROM community_profile_interests WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb, date) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb, date) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- get_my_community_profile — suma birthdate al retorno (misma firma).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_community_profile(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alias text; v_bio text; v_visible boolean; v_bd date; v_found boolean; result json;
BEGIN
    SELECT alias, bio, visible, birthdate INTO v_alias, v_bio, v_visible, v_bd
    FROM community_profiles WHERE clerk_user_id = p_clerk_user_id;
    v_found := FOUND;

    SELECT json_build_object(
        'has_profile', v_found,
        'alias',   COALESCE(v_alias, ''),
        'bio',     COALESCE(v_bio, ''),
        'visible', COALESCE(v_visible, false),
        'birthdate', v_bd,
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
-- get_community_profile — suma age (de birthdate) + el último escaneo COMPLETO
-- (Índice de Luz + 6 pilares). Misma firma → conserva permisos.
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
    v_alias text; v_bio text; v_avatar text; v_equipped jsonb; v_mastery int; v_bd date;
    v_scan json;
    result json;
BEGIN
    SELECT
        cp.alias, cp.bio, cp.birthdate,
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_bd, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND cp.visible
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> '';

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    -- Último escaneo COMPLETO (6/6 pilares) del Tripulante → Índice + pilares.
    -- Membresía exacta del pilar entre comillas (TEXT, sin cast a jsonb).
    SELECT json_build_object(
        'indice',     sv.indice_silicio,
        'fisico',     sv.hardware_fisico,
        'mental',     sv.procesador_mental,
        'emocional',  sv.motor_emocional,
        'financiero', sv.gravedad_financiera,
        'vector',     sv.vector_expansion,
        'orbita',     sv.orbita_relacional,
        'scanned_at', sv.created_at
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

    SELECT json_build_object(
        'clerk_user_id', tgt,
        'alias', v_alias,
        'bio', v_bio,
        'avatar_key', v_avatar,
        'equipped', v_equipped,
        'mastery', v_mastery,
        -- Edad calculada (no la fecha exacta, por privacidad). NULL si no la puso.
        'age', CASE WHEN v_bd IS NULL THEN NULL
                    ELSE date_part('year', age(v_bd))::int END,
        'scan', v_scan,
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
