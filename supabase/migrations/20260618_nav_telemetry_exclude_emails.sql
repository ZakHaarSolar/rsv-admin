-- Red Solar Viva · Telemetría de Navegación — actualizar cuentas internas excluibles
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Suma 3 correos internos a la lista que excluye el toggle "Excluir mis
-- cuentas" del panel de Navegación (Motor de Intervención):
--   + veocancun@gmail.com
--   + veotuluzinterna@gmail.com
--   + redsolarviva@gmail.com
-- (Se conservan los 4 previos, incluido cuerpodeluz555@gmail.com.)
--
-- Misma firma que la v2 → CREATE OR REPLACE reemplaza en sitio (los GRANT
-- existentes se preservan; igual se re-afirma el lock al final).

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

-- Re-afirmar el lock (idempotente).
REVOKE EXECUTE ON FUNCTION get_nav_telemetry(TEXT, TEXT, BOOLEAN, BOOLEAN)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nav_telemetry(TEXT, TEXT, BOOLEAN, BOOLEAN)
    TO service_role;
