-- Red Solar Viva · Ritual Diario · datos por tripulante para el Motor (admin)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Lee, para un tripulante, sus datos del Ritual Diario: Fotones totales, racha,
-- rituales activos AHORA, últimos 7 días (qué rituales cumplió cada día) y uso
-- por ritual de los últimos 30 días (para saber cuál usan más / cuál se les
-- dificulta). La historia NO se pierde al pasar el día: daily_checkins guarda
-- 1 fila por tripulante × ritual × día para siempre.
--
-- Seguridad: SECURITY DEFINER + doble blindaje (valida is_admin con el id
-- admin verificado que inyecta el gateway admin-action). REVOKE anon.

CREATE OR REPLACE FUNCTION public.admin_get_user_ritual_data(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d      date := (now() AT TIME ZONE 'America/Cancun')::date;
    streak integer := 0;
    cur    date;
    result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Racha (días consecutivos con ≥1 check, terminando hoy o ayer).
    cur := d;
    IF NOT EXISTS (SELECT 1 FROM daily_checkins
                   WHERE clerk_user_id = p_target_clerk_id AND checkin_date = cur) THEN
        cur := cur - 1;
    END IF;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM daily_checkins
                              WHERE clerk_user_id = p_target_clerk_id AND checkin_date = cur);
        streak := streak + 1;
        cur := cur - 1;
    END LOOP;

    SELECT json_build_object(
        'total_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins WHERE clerk_user_id = p_target_clerk_id
        ), 0),
        'streak', streak,
        'days_active', COALESCE((
            SELECT COUNT(DISTINCT checkin_date)::int FROM daily_checkins
            WHERE clerk_user_id = p_target_clerk_id
        ), 0),
        'first_day', (
            SELECT MIN(checkin_date)::text FROM daily_checkins WHERE clerk_user_id = p_target_clerk_id
        ),
        -- Rituales activos AHORA = catálogo activo sin un config.enabled=false.
        'active', COALESCE((
            SELECT json_agg(json_build_object('activity_key', c.activity_key, 'label', c.label) ORDER BY c.sort_order)
            FROM daily_ritual_catalog c
            WHERE c.active
              AND NOT EXISTS (
                  SELECT 1 FROM daily_ritual_config cf
                  WHERE cf.clerk_user_id = p_target_clerk_id
                    AND cf.activity_key = c.activity_key
                    AND cf.enabled = false
              )
        ), '[]'::json),
        -- Últimos 7 días (incluye hoy), más reciente primero.
        'days', COALESCE((
            SELECT json_agg(day_obj ORDER BY dt DESC)
            FROM (
                SELECT (d - g.n) AS dt,
                    json_build_object(
                        'date', (d - g.n)::text,
                        'fotones', COALESCE((
                            SELECT SUM(points)::int FROM daily_checkins
                            WHERE clerk_user_id = p_target_clerk_id AND checkin_date = (d - g.n)
                        ), 0),
                        'items', COALESCE((
                            SELECT json_agg(json_build_object(
                                'activity_key', dc.activity_key,
                                'label', COALESCE(cat.label, dc.activity_key),
                                'points', dc.points
                            ) ORDER BY dc.activity_key)
                            FROM daily_checkins dc
                            LEFT JOIN daily_ritual_catalog cat ON cat.activity_key = dc.activity_key
                            WHERE dc.clerk_user_id = p_target_clerk_id AND dc.checkin_date = (d - g.n)
                        ), '[]'::json)
                    ) AS day_obj
                FROM generate_series(0, 6) AS g(n)
            ) q
        ), '[]'::json),
        -- Uso por ritual en los últimos 30 días (más usado primero).
        'by_activity', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', cat.activity_key,
                'label', cat.label,
                'count', COALESCE(u.cnt, 0),
                'fotones', COALESCE(u.fot, 0)
            ) ORDER BY COALESCE(u.cnt, 0) DESC, cat.sort_order)
            FROM daily_ritual_catalog cat
            LEFT JOIN (
                SELECT activity_key, COUNT(*)::int AS cnt, SUM(points)::int AS fot
                FROM daily_checkins
                WHERE clerk_user_id = p_target_clerk_id AND checkin_date >= d - 29
                GROUP BY activity_key
            ) u ON u.activity_key = cat.activity_key
            WHERE cat.active
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_user_ritual_data(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_user_ritual_data(text, text) TO service_role;
