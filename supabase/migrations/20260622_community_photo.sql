-- Red Solar Viva · COMUNIDAD · Foto de perfil (vehículo físico) OPT-IN
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El Tripulante puede ELEGIR mostrar su foto (la que ya subió a R2, guardada en
-- unsafeMetadata.avatarUrl) en su perfil público. En el grid de Explorar SIEMPRE
-- se ve el avatar de luz (escala 10K + "vibración por encima de apariencia"); la
-- foto solo aparece en la TARJETA de detalle, y solo si el dueño la activó, tras
-- tocar "Revelar vehículo físico". Sin Fotones de por medio: es gratis y opt-in.
--
-- Reproduce los cuerpos VIGENTES (20260621i) y los extiende con show_photo +
-- photo_url. El gateway user-action ya reenvía los params nuevos (spread de
-- params + inyección del id) → NO requiere redeploy del edge.

-- ── Columnas ────────────────────────────────────────────────────────
ALTER TABLE public.community_profiles
    ADD COLUMN IF NOT EXISTS show_photo boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_profiles
    ADD COLUMN IF NOT EXISTS photo_url text;

-- ════════════════════════════════════════════════════════════════════
-- set_my_community_profile — suma p_show_photo + p_photo_url (firma cambia → DROP+CREATE).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.set_my_community_profile(text, text, text, boolean, jsonb, date, text);
CREATE OR REPLACE FUNCTION public.set_my_community_profile(
    p_clerk_user_id text,
    p_alias    text,
    p_bio      text,
    p_visible  boolean,
    p_interests jsonb,
    p_birthdate date DEFAULT NULL,
    p_relationship_pref text DEFAULT NULL,
    p_show_photo boolean DEFAULT false,
    p_photo_url text DEFAULT NULL
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
    v_pref  text := CASE
        WHEN p_relationship_pref IN ('amor', 'amistad') THEN p_relationship_pref
        ELSE NULL
    END;
    -- Solo se guarda una URL https razonable (la foto vive en R2).
    v_photo text := CASE
        WHEN p_photo_url ~ '^https://' AND length(p_photo_url) <= 500 THEN p_photo_url
        ELSE NULL
    END;
    -- Mostrar la foto solo si la pidió Y hay una URL válida.
    v_show  boolean := COALESCE(p_show_photo, false) AND v_photo IS NOT NULL;
    result  json;
BEGIN
    INSERT INTO community_profiles (clerk_user_id, alias, bio, visible, birthdate, relationship_pref, show_photo, photo_url, updated_at)
    VALUES (p_clerk_user_id, v_alias, v_bio, v_vis, v_bd, v_pref, v_show, v_photo, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET alias = EXCLUDED.alias,
            bio = EXCLUDED.bio,
            visible = EXCLUDED.visible,
            birthdate = EXCLUDED.birthdate,
            relationship_pref = EXCLUDED.relationship_pref,
            show_photo = EXCLUDED.show_photo,
            photo_url = EXCLUDED.photo_url,
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
        'show_photo', v_show, 'photo_url', v_photo,
        'interests', COALESCE((
            SELECT json_agg(interest_key ORDER BY interest_key)
            FROM community_profile_interests WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb, date, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb, date, text, boolean, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- get_my_community_profile — suma show_photo + photo_url al retorno (misma firma).
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
    v_show boolean; v_photo text;
    v_found boolean; result json;
BEGIN
    SELECT alias, bio, visible, birthdate, relationship_pref, show_photo, photo_url
    INTO v_alias, v_bio, v_visible, v_bd, v_pref, v_show, v_photo
    FROM community_profiles WHERE clerk_user_id = p_clerk_user_id;
    v_found := FOUND;

    SELECT json_build_object(
        'has_profile', v_found,
        'alias',   COALESCE(v_alias, ''),
        'bio',     COALESCE(v_bio, ''),
        'visible', COALESCE(v_visible, false),
        'birthdate', v_bd,
        'relationship_pref', v_pref,
        'show_photo', COALESCE(v_show, false),
        'photo_url', v_photo,
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
-- get_community_profile — suma 'photo' (URL solo si el dueño la activó).
-- Misma firma. Reproduce el cuerpo VIGENTE (20260621i: bloqueos/baneos + scan +
-- age + medallas) y agrega la foto opt-in.
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
