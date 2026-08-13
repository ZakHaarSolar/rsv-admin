-- Red Solar Viva · CAPA DE COMUNIDAD · FIX del directorio (opt-in gobierna) +
-- excluir el propio perfil del directorio
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- PROBLEMA: el directorio (get_community_directory), el detalle
-- (get_community_profile) y el inicio de chat (dm_start_conversation) excluían
-- por correo las "7 cuentas internas" — el MISMO set que Campo Solar /
-- Navegación. Ese set incluye las DOS cuentas con las que se prueba la
-- Comunidad (cuerpodeluz555@gmail.com y andrea.dl13@gmail.com) → al hacerse
-- ambas públicas, cada una quedaba excluida de la vista de la otra → "no hay
-- nadie".
--
-- DECISIÓN: para una capa SOCIAL el portero correcto es el OPT-IN (cp.visible +
-- alias no vacío), NO una lista negra de correos. La lista negra tiene sentido
-- en AGREGADOS sin opt-in (Campo Solar suma a todos automáticamente; Navegación
-- mide a todos) — ahí SE MANTIENE. En el directorio se ELIMINA: cualquier
-- Tripulante que se haga visible aparece; las cuentas de marca NO aparecen
-- simplemente por no optar (visible = false es el default). Si en el futuro se
-- quiere ocultar una cuenta de marca SIEMPRE (aunque opte), se vuelve a agregar
-- aquí de forma puntual.
--
-- Además: el directorio ahora EXCLUYE tu propio perfil (ves a OTROS, no a ti).
--
-- Todas son CREATE OR REPLACE con la MISMA firma → conservan los permisos
-- (REVOKE anon + GRANT service_role) ya aplicados en 20260620i / 20260620j.

-- ════════════════════════════════════════════════════════════════════
-- Directorio: opt-in gobierna + excluye el propio perfil.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_community_directory(
    p_clerk_user_id text,
    p_interest text DEFAULT NULL,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
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
    result json;
BEGIN
    WITH visibles AS (
        SELECT cp.clerk_user_id, cp.alias, cp.bio
        FROM community_profiles cp
        WHERE cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
          AND cp.clerk_user_id <> p_clerk_user_id   -- no te muestras a ti mismo
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
            v.clerk_user_id,
            v.alias,
            v.bio,
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
            e.clerk_user_id,
            e.alias,
            e.bio,
            e.avatar_key,
            e.equipped,
            e.mastery,
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

-- ════════════════════════════════════════════════════════════════════
-- Detalle de un perfil: opt-in gobierna (sin lista negra de correos).
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
    result json;
BEGIN
    SELECT
        cp.alias, cp.bio,
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND cp.visible
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> '';

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT json_build_object(
        'clerk_user_id', tgt,
        'alias', v_alias,
        'bio', v_bio,
        'avatar_key', v_avatar,
        'equipped', v_equipped,
        'mastery', v_mastery,
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

-- ════════════════════════════════════════════════════════════════════
-- Inicio de chat: opt-in gobierna (sin lista negra de correos).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.dm_start_conversation(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me  text := p_clerk_user_id;
    tgt text := COALESCE(p_target_clerk_id, '');
    a   text; b text; cid bigint;
BEGIN
    IF tgt = '' OR tgt = me THEN
        RETURN json_build_object('error', 'bad_target');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM community_profiles cp
        WHERE cp.clerk_user_id = tgt
          AND cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
    ) THEN
        RETURN json_build_object('error', 'target_unavailable');
    END IF;

    IF me < tgt THEN a := me; b := tgt; ELSE a := tgt; b := me; END IF;

    INSERT INTO dm_conversations (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a  -- no-op para que RETURNING devuelva la fila existente
    RETURNING id INTO cid;

    RETURN json_build_object('ok', true, 'conversation_id', cid);
END;
$$;
