-- Red Solar Viva · CAPA DE COMUNIDAD · Fase 1 — Perfiles públicos opt-in +
-- intereses + directorio (Constelación de la Red)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Norte: que los Tripulantes se vean entre sí — avatar + Maestría (Fotones) +
-- intereses afines — para crear pertenencia + crecimiento orgánico. La
-- mensajería es Fase 2; esto deja el cimiento.
--
-- Decisiones de privacidad (CERO PII expuesto):
--   1) Perfil público OPT-IN: cada Tripulante elige hacerse VISIBLE con un
--      alias + bio corta opcional + intereses. Mientras no opte (visible=false,
--      el DEFAULT), NO aparece en el directorio. Nunca se expone email.
--   2) El avatar ya vive en user_crystal_state.selected_avatar+equipped; los
--      datos mostrados (Maestría = total de días cerrados, etapa) se DERIVAN.
--   3) El directorio EXCLUYE las 7 cuentas internas (mismas que Campo Solar /
--      Navegación) y respeta el opt-in (visible + alias no vacío).
--
-- Catálogo de intereses DB-driven → Zak edita categorías desde el Motor, sin
-- build. Seguridad: tablas RLS sin policies → solo vía RPCs SECURITY DEFINER;
-- las del Tripulante por el gateway user-action (inyecta el clerk_user_id
-- verificado), las admin por admin-action. REVOKE anon en todas.

-- ════════════════════════════════════════════════════════════════════
-- TABLAS
-- ════════════════════════════════════════════════════════════════════

-- Perfil público opt-in del Tripulante.
CREATE TABLE IF NOT EXISTS public.community_profiles (
    clerk_user_id text PRIMARY KEY,
    alias         text NOT NULL DEFAULT '',
    bio           text NOT NULL DEFAULT '',
    visible       boolean NOT NULL DEFAULT false,   -- false = privado (default)
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_profiles_visible ON public.community_profiles (visible);

-- Catálogo de intereses/categorías (admin-editable desde el Motor).
CREATE TABLE IF NOT EXISTS public.community_interests (
    interest_key text PRIMARY KEY,
    label        text NOT NULL,
    sort_order   integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true,
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- N:M Tripulante ↔ intereses elegidos.
CREATE TABLE IF NOT EXISTS public.community_profile_interests (
    clerk_user_id text NOT NULL,
    interest_key  text NOT NULL REFERENCES public.community_interests (interest_key) ON DELETE CASCADE,
    PRIMARY KEY (clerk_user_id, interest_key)
);
CREATE INDEX IF NOT EXISTS idx_cpi_user     ON public.community_profile_interests (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_cpi_interest ON public.community_profile_interests (interest_key);

ALTER TABLE public.community_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_interests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_profile_interests ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- RPCs DEL TRIPULANTE  (ruteadas por user-action; inyecta p_clerk_user_id)
-- ════════════════════════════════════════════════════════════════════

-- Mi perfil de comunidad + mis intereses + el catálogo activo (para el editor
-- de onboarding). Si nunca opté, has_profile=false y todo viene vacío.
CREATE OR REPLACE FUNCTION public.get_my_community_profile(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alias text; v_bio text; v_visible boolean; v_found boolean; result json;
BEGIN
    SELECT alias, bio, visible INTO v_alias, v_bio, v_visible
    FROM community_profiles WHERE clerk_user_id = p_clerk_user_id;
    v_found := FOUND;

    SELECT json_build_object(
        'has_profile', v_found,
        'alias',   COALESCE(v_alias, ''),
        'bio',     COALESCE(v_bio, ''),
        'visible', COALESCE(v_visible, false),
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

-- Guarda mi perfil + reemplaza mis intereses. visible solo si hay alias.
-- p_interests = jsonb array de interest_keys (tope 8, deben existir + activos).
CREATE OR REPLACE FUNCTION public.set_my_community_profile(
    p_clerk_user_id text,
    p_alias    text,
    p_bio      text,
    p_visible  boolean,
    p_interests jsonb
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
    result  json;
BEGIN
    INSERT INTO community_profiles (clerk_user_id, alias, bio, visible, updated_at)
    VALUES (p_clerk_user_id, v_alias, v_bio, v_vis, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET alias = EXCLUDED.alias,
            bio = EXCLUDED.bio,
            visible = EXCLUDED.visible,
            updated_at = now();

    -- Reemplaza intereses (borra + inserta los válidos: existen, activos, tope 8).
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
        'interests', COALESCE((
            SELECT json_agg(interest_key ORDER BY interest_key)
            FROM community_profile_interests WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- Directorio paginado de perfiles VISIBLES (excluye internos + sin alias),
-- opcionalmente filtrado por interés. Cada perfil trae avatar_key + equipped +
-- Maestría (días cerrados, mismo criterio que get_crystal_chamber) + intereses.
-- Incluye el catálogo de elementos (para render del avatar) y la lista de
-- intereses activos (para los chips de filtro) → un solo round-trip.
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
        LEFT JOIN profiles p ON p.clerk_user_id = cp.clerk_user_id
        WHERE cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
          AND (
            p.email IS NULL
            OR lower(p.email) NOT IN (
                'andrea.dl13@gmail.com',
                'beachandsunrisecancun@gmail.com',
                'cuerpodeluz555@gmail.com',
                'diegosotoborjaalmeida@gmail.com',
                'redsolarviva@gmail.com',
                'veocancun@gmail.com',
                'veotuluzinterna@gmail.com'
            )
          )
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
        -- clerk_user_id como desempate determinista (alias no es único) →
        -- paginación estable: sin filas repetidas/saltadas entre páginas.
        ORDER BY e.mastery DESC, e.alias ASC, e.clerk_user_id ASC
        LIMIT lim OFFSET off
    )
    SELECT json_build_object(
        'total', (SELECT COUNT(*) FROM enriched),
        'profiles', COALESCE(
            -- json_agg NO preserva el orden del CTE sin su propio ORDER BY →
            -- se repite el mismo orden (con el desempate) para garantizar la salida.
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

-- Detalle de UN perfil (solo si es visible + no interno). Trae avatar + equipado
-- + Maestría + intereses (con label) + catálogo para el render grande.
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
    LEFT JOIN profiles p ON p.clerk_user_id = cp.clerk_user_id
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND cp.visible
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
      AND (
        p.email IS NULL
        OR lower(p.email) NOT IN (
            'andrea.dl13@gmail.com',
            'beachandsunrisecancun@gmail.com',
            'cuerpodeluz555@gmail.com',
            'diegosotoborjaalmeida@gmail.com',
            'redsolarviva@gmail.com',
            'veocancun@gmail.com',
            'veotuluzinterna@gmail.com'
        )
      );

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
-- RPCs ADMIN — editor del catálogo de intereses (Motor → "Comunidad")
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_community_interests(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    SELECT COALESCE(json_agg(json_build_object(
        'interest_key', ci.interest_key,
        'label', ci.label,
        'sort_order', ci.sort_order,
        'active', ci.active,
        'members', (SELECT COUNT(*) FROM community_profile_interests pi WHERE pi.interest_key = ci.interest_key)
    ) ORDER BY ci.sort_order, ci.label), '[]'::json)
    INTO result FROM community_interests ci;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_community_interest(
    p_admin_clerk_id text,
    p_interest_key   text,
    p_label          text,
    p_sort_order     integer,
    p_active         boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  community_interests%ROWTYPE;
    ik text := LEFT(LOWER(TRIM(COALESCE(p_interest_key, ''))), 60);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF LENGTH(ik) = 0 THEN RETURN json_build_object('error', 'empty_key'); END IF;

    INSERT INTO community_interests (interest_key, label, sort_order, active, updated_at)
    VALUES (
        ik,
        COALESCE(NULLIF(TRIM(p_label), ''), ik),
        COALESCE(p_sort_order, 0),
        COALESCE(p_active, true),
        now()
    )
    ON CONFLICT (interest_key) DO UPDATE
        SET label      = COALESCE(NULLIF(TRIM(p_label), ''), community_interests.label),
            sort_order = COALESCE(p_sort_order, community_interests.sort_order),
            active     = COALESCE(p_active, community_interests.active),
            updated_at = now()
    RETURNING * INTO r;

    RETURN json_build_object(
        'interest_key', r.interest_key,
        'label', r.label,
        'sort_order', r.sort_order,
        'active', r.active,
        'members', (SELECT COUNT(*) FROM community_profile_interests pi WHERE pi.interest_key = r.interest_key)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_community_interest(
    p_admin_clerk_id text,
    p_interest_key   text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    -- El FK ON DELETE CASCADE limpia community_profile_interests.
    DELETE FROM community_interests WHERE interest_key = p_interest_key;
    RETURN json_build_object('deleted', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- SEED del catálogo de intereses (idempotente — NO pisa lo que Zak edite).
-- ════════════════════════════════════════════════════════════════════
INSERT INTO public.community_interests (interest_key, label, sort_order) VALUES
    ('viajes_astrales',   'Viajes astrales',     1),
    ('meditacion',        'Meditación',          2),
    ('veganismo',         'Veganismo',           3),
    ('telekinesis',       'Telekinesis',         4),
    ('sanacion',          'Sanación energética', 5),
    ('geometria_sagrada', 'Geometría sagrada',   6),
    ('suenos_lucidos',    'Sueños lúcidos',      7),
    ('astrologia',        'Astrología',          8),
    ('manifestacion',     'Manifestación',       9),
    ('tarot',             'Tarot y oráculos',    10)
ON CONFLICT (interest_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS
-- ════════════════════════════════════════════════════════════════════
-- RPCs del Tripulante: solo service_role (las llama user-action tras verificar el token).
REVOKE EXECUTE ON FUNCTION public.get_my_community_profile(text)                                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_community_directory(text, text, integer, integer)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_community_profile(text, text)                               FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_community_profile(text)                                  TO service_role;
GRANT  EXECUTE ON FUNCTION public.set_my_community_profile(text, text, text, boolean, jsonb)      TO service_role;
GRANT  EXECUTE ON FUNCTION public.get_community_directory(text, text, integer, integer)           TO service_role;
GRANT  EXECUTE ON FUNCTION public.get_community_profile(text, text)                               TO service_role;

-- RPCs admin: solo service_role (las llama admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_community_interests(text)                             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_community_interest(text, text, text, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_community_interest(text, text)                     FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_community_interests(text)                             TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_community_interest(text, text, text, integer, boolean) TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_delete_community_interest(text, text)                     TO service_role;
