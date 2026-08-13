-- Red Solar Viva · Campo Solar · excluir cuentas internas + editor del colectivo
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- (1) get_campo_solar ahora EXCLUYE las 7 cuentas internas (mismas que la
--     pestaña Navegación del Motor) además de la fila sentinela admin_adjust.
-- (2) Editor del colectivo para pruebas: como nuestra cuenta admin está
--     EXCLUIDA, sumarle Fotones no mueve el colectivo. Para poder mover el
--     número del colectivo usamos una CUENTA SEMILLA ('campo_solar_seed',
--     activity_key 'campo_seed') que SÍ cuenta (no es admin_adjust, no tiene
--     email interno). admin_adjust_campo_solar suma/resta a esa semilla →
--     mueve el colectivo; reset a 0 devuelve el campo a su estado natural.
--     admin_get_campo_solar devuelve colectivo + cuántos Fotones tiene la semilla.

-- ── (1) get_campo_solar con exclusión de correos internos (fuente única) ──
CREATE OR REPLACE FUNCTION public.get_campo_solar()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total        bigint := 0;
    contributors integer := 0;
BEGIN
    SELECT COALESCE(SUM(dc.points), 0), COUNT(DISTINCT dc.clerk_user_id)
    INTO total, contributors
    FROM daily_checkins dc
    LEFT JOIN profiles p ON p.clerk_user_id = dc.clerk_user_id
    WHERE dc.activity_key <> 'admin_adjust'
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

    RETURN json_build_object('total', total, 'contributors', contributors);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_campo_solar() TO anon, authenticated;

-- ── (2) Editor admin del colectivo (vía cuenta semilla) ──────────────
CREATE OR REPLACE FUNCTION public.admin_get_campo_solar(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    seed_uid text := 'campo_solar_seed';
    d        date := DATE '2000-01-02';
    seedp    integer;
    cs       json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(points, 0) INTO seedp
    FROM daily_checkins
    WHERE clerk_user_id = seed_uid AND activity_key = 'campo_seed' AND checkin_date = d;

    cs := public.get_campo_solar();

    RETURN json_build_object(
        'seed_points', COALESCE(seedp, 0),
        'collective_total', (cs->>'total')::bigint,
        'collective_contributors', (cs->>'contributors')::int
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_campo_solar(p_admin_clerk_id text, p_delta integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    seed_uid text := 'campo_solar_seed';
    d        date := DATE '2000-01-02';
    cur      integer;
    nw       integer;
    cs       json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(points, 0) INTO cur
    FROM daily_checkins
    WHERE clerk_user_id = seed_uid AND activity_key = 'campo_seed' AND checkin_date = d;

    nw := GREATEST(0, COALESCE(cur, 0) + COALESCE(p_delta, 0));

    INSERT INTO daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
    VALUES (seed_uid, 'campo_seed', d, nw, 'semilla campo solar (pruebas)')
    ON CONFLICT (clerk_user_id, activity_key, checkin_date)
    DO UPDATE SET points = EXCLUDED.points, note = EXCLUDED.note;

    cs := public.get_campo_solar();

    RETURN json_build_object(
        'ok', true,
        'seed_points', nw,
        'collective_total', (cs->>'total')::bigint,
        'collective_contributors', (cs->>'contributors')::int
    );
END;
$$;

-- ── Permisos: las admin_* solo service_role (gateway admin-action) ──
REVOKE EXECUTE ON FUNCTION public.admin_get_campo_solar(text)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_campo_solar(text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_campo_solar(text)             TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_adjust_campo_solar(text, integer) TO service_role;
