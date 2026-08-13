-- Red Solar Viva · Telemetría de Navegación v2
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- (Requiere 20260617_nav_telemetry.sql ya aplicado — crea la tabla.)
--
-- v2 (2026-06-17):
--   · Retención 7 DÍAS: record_nav_event purga oportunistamente (~2% de
--     inserts) las filas > 7 días → la tabla se auto-limpia sin cron.
--   · get_nav_telemetry ahora acepta: p_day (fecha YYYY-MM-DD o NULL=7d),
--     p_distinct ("Sin Repetición": cuenta 1 por usuario/capa) y
--     p_exclude (excluye las cuentas internas). Devuelve además el listado
--     de NODOS con datos + las fechas de los últimos 7 días (selector).
--   · get_nav_telemetry_node: drill-down de UN nodo (capas/sub-capas).
--
-- Seguridad: SECURITY DEFINER + admin gate; sólo service_role (vía gateway
-- admin-action / user-action). Cuentas internas excluibles por toggle.

-- ── Cuentas internas (excluibles con el toggle del panel) ──────────
--   Editá esta lista si cambian. Sólo aplican cuando p_exclude = true.

-- ── record_nav_event v2: + purga oportunista de >7 días ────────────
CREATE OR REPLACE FUNCTION record_nav_event(
    p_clerk_user_id TEXT,
    p_layer         TEXT,
    p_sublayer      TEXT DEFAULT NULL,
    p_platform      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR p_layer IS NULL
       OR LENGTH(TRIM(p_clerk_user_id)) = 0
       OR LENGTH(TRIM(p_layer)) = 0 THEN
        RETURN;
    END IF;
    INSERT INTO nav_events (clerk_user_id, layer, sublayer, platform)
    VALUES (
        p_clerk_user_id,
        LEFT(p_layer, 64),
        NULLIF(LEFT(COALESCE(p_sublayer, ''), 64), ''),
        NULLIF(LEFT(COALESCE(p_platform, ''), 24), '')
    );
    /* Retención 7 días — purga amortizada (~2% de los inserts). */
    IF random() < 0.02 THEN
        DELETE FROM nav_events WHERE created_at < (NOW() - INTERVAL '7 days');
    END IF;
END;
$$;

-- ── get_nav_telemetry v2 (agregado + nodos + selector de días) ─────
DROP FUNCTION IF EXISTS get_nav_telemetry(TEXT);
CREATE OR REPLACE FUNCTION get_nav_telemetry(
    admin_clerk_id TEXT,
    p_day          TEXT DEFAULT NULL,
    p_distinct     BOOLEAN DEFAULT FALSE,
    p_exclude      BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    internal_emails TEXT[] := ARRAY[
        'diegosotoborjaalmeida@gmail.com',
        'cuerpodeluz555@gmail.com',
        'andrea.dl13@gmail.com',
        'beachandsunrisecancun@gmail.com',
        'veocancun@gmail.com',
        'veotuluzinterna@gmail.com',
        'redsolarviva@gmail.com'
    ];
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH excl AS (
        SELECT clerk_user_id FROM profiles
        WHERE p_exclude
          AND LOWER(TRIM(email)) = ANY(internal_emails)
    ),
    base AS (
        SELECT e.*
        FROM nav_events e
        WHERE e.created_at >= (NOW() - INTERVAL '7 days')
          AND (NOT p_exclude OR e.clerk_user_id NOT IN (SELECT clerk_user_id FROM excl))
    ),
    scoped AS (
        SELECT * FROM base
        WHERE p_day IS NULL
           OR (created_at AT TIME ZONE 'America/Cancun')::date = p_day::date
    )
    SELECT json_build_object(
        'total_events', (
            SELECT CASE WHEN p_distinct
                THEN COUNT(DISTINCT clerk_user_id)
                ELSE COUNT(*) END
            FROM scoped
        ),
        'total_users', (SELECT COUNT(DISTINCT clerk_user_id) FROM scoped),
        'days', COALESCE((
            SELECT json_agg(json_build_object(
                'date', d.day::text,
                'events', (
                    SELECT COUNT(*) FROM base b
                    WHERE (b.created_at AT TIME ZONE 'America/Cancun')::date = d.day
                )
            ) ORDER BY d.day DESC)
            FROM (
                SELECT generate_series(
                    (NOW() AT TIME ZONE 'America/Cancun')::date - 6,
                    (NOW() AT TIME ZONE 'America/Cancun')::date,
                    INTERVAL '1 day'
                )::date AS day
            ) d
        ), '[]'::json),
        'layers', COALESCE((
            SELECT json_agg(row_to_json(l) ORDER BY l.events DESC)
            FROM (
                SELECT
                    layer,
                    (CASE WHEN p_distinct
                        THEN COUNT(DISTINCT clerk_user_id)
                        ELSE COUNT(*) END)::INT AS events,
                    COUNT(DISTINCT clerk_user_id)::INT AS users,
                    MAX(created_at) AS last_seen
                FROM scoped
                GROUP BY layer
            ) l
        ), '[]'::json),
        'sublayers', COALESCE((
            SELECT json_agg(row_to_json(s) ORDER BY s.events DESC)
            FROM (
                SELECT
                    layer,
                    sublayer,
                    (CASE WHEN p_distinct
                        THEN COUNT(DISTINCT clerk_user_id)
                        ELSE COUNT(*) END)::INT AS events,
                    COUNT(DISTINCT clerk_user_id)::INT AS users,
                    MAX(created_at) AS last_seen
                FROM scoped
                WHERE sublayer IS NOT NULL
                GROUP BY layer, sublayer
            ) s
        ), '[]'::json),
        'nodes', COALESCE((
            SELECT json_agg(row_to_json(n) ORDER BY n.opens DESC)
            FROM (
                SELECT
                    sc.clerk_user_id,
                    p.email,
                    p.full_name,
                    COUNT(*)::INT AS opens,
                    COUNT(DISTINCT COALESCE(sc.layer, '') || '|' || COALESCE(sc.sublayer, ''))::INT AS screens,
                    MAX(sc.created_at) AS last_seen
                FROM scoped sc
                LEFT JOIN profiles p ON p.clerk_user_id = sc.clerk_user_id
                GROUP BY sc.clerk_user_id, p.email, p.full_name
            ) n
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- ── get_nav_telemetry_node: drill-down de UN nodo ──────────────────
CREATE OR REPLACE FUNCTION get_nav_telemetry_node(
    admin_clerk_id    TEXT,
    p_target_clerk_id TEXT,
    p_day             TEXT DEFAULT NULL,
    p_distinct        BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH scoped AS (
        SELECT e.*
        FROM nav_events e
        WHERE e.clerk_user_id = p_target_clerk_id
          AND e.created_at >= (NOW() - INTERVAL '7 days')
          AND (p_day IS NULL
               OR (e.created_at AT TIME ZONE 'America/Cancun')::date = p_day::date)
    )
    SELECT json_build_object(
        'email', (SELECT email FROM profiles WHERE clerk_user_id = p_target_clerk_id LIMIT 1),
        'full_name', (SELECT full_name FROM profiles WHERE clerk_user_id = p_target_clerk_id LIMIT 1),
        'total_events', (
            SELECT CASE WHEN p_distinct THEN COUNT(DISTINCT layer) ELSE COUNT(*) END
            FROM scoped
        ),
        'last_seen', (SELECT MAX(created_at) FROM scoped),
        'layers', COALESCE((
            SELECT json_agg(row_to_json(l) ORDER BY l.events DESC)
            FROM (
                SELECT
                    layer,
                    (CASE WHEN p_distinct THEN 1 ELSE COUNT(*) END)::INT AS events,
                    MAX(created_at) AS last_seen
                FROM scoped
                GROUP BY layer
            ) l
        ), '[]'::json),
        'sublayers', COALESCE((
            SELECT json_agg(row_to_json(s) ORDER BY s.events DESC)
            FROM (
                SELECT
                    layer,
                    sublayer,
                    (CASE WHEN p_distinct THEN 1 ELSE COUNT(*) END)::INT AS events,
                    MAX(created_at) AS last_seen
                FROM scoped
                WHERE sublayer IS NOT NULL
                GROUP BY layer, sublayer
            ) s
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- ── Locks ──────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION record_nav_event(TEXT, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_nav_event(TEXT, TEXT, TEXT, TEXT)
    TO service_role;
REVOKE EXECUTE ON FUNCTION get_nav_telemetry(TEXT, TEXT, BOOLEAN, BOOLEAN)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nav_telemetry(TEXT, TEXT, BOOLEAN, BOOLEAN)
    TO service_role;
REVOKE EXECUTE ON FUNCTION get_nav_telemetry_node(TEXT, TEXT, TEXT, BOOLEAN)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nav_telemetry_node(TEXT, TEXT, TEXT, BOOLEAN)
    TO service_role;
