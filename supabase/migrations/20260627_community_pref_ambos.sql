-- 20260627_community_pref_ambos.sql
-- "¿Qué buscas en la Red?" pasa a MULTI-SELECT: Amistades / Conexiones románticas
-- / AMBAS. relationship_pref ya es text → solo se suma el valor 'ambos':
--   · set_my_community_profile: acepta 'ambos' (antes lo descartaba a NULL).
--   · get_community_directory: filtrar por 'amistad' incluye a quienes eligieron
--     'ambos'; filtrar por 'amor' también. (Quien busca romance suele estar
--     abierto a amistad → no se "esconde" de ninguno de los dos filtros.)
-- CREATE OR REPLACE sin cambiar firma → conserva permisos; igual re-afirmamos
-- el REVOKE/GRANT por higiene. Ambas viajan por el gateway user-action.

-- ════════════════════════════════════════════════════════════════════
-- 1) set_my_community_profile — acepta 'ambos'.
-- ════════════════════════════════════════════════════════════════════
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
        WHEN p_relationship_pref IN ('amor', 'amistad', 'ambos') THEN p_relationship_pref
        ELSE NULL
    END;
    v_photo text := CASE
        WHEN p_photo_url ~ '^https://' AND length(p_photo_url) <= 500 THEN p_photo_url
        ELSE NULL
    END;
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
-- 2) get_community_directory — el filtro por preferencia incluye a 'ambos'.
-- ════════════════════════════════════════════════════════════════════
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
          -- 'ambos' aparece tanto en el filtro de amistad como en el de amor.
          AND (prf IS NULL OR cp.relationship_pref = prf OR cp.relationship_pref = 'ambos')
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
