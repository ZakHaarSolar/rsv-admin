-- Red Solar Viva · get_app_version_summary
-- =====================================================================
-- La versión de app MÁS ALTA que reportan los nodos (telemetría `app_version`
-- en `profiles`, alimentada por set_app_version desde la app). El Motor la
-- muestra debajo del título para VERIFICAR que la versión en circulación /
-- testing sea la que se está por enviar a la App Store — es decir, que el
-- APP_VERSION del código (lib/appVersion.ts) esté bien marcado en cada build.
--
-- Si el Motor dice "1.0.7" pero ya estás trabajando en 1.0.8, significa que el
-- APP_VERSION del código quedó en 1.0.7 (no se subió) → lo cachas antes de Apple.
--
-- Admin-gate por profiles.is_admin (bool_or tolera perfiles duplicados).

CREATE OR REPLACE FUNCTION public.get_app_version_summary(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
      FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;

    RETURN json_build_object(
        'top', (
            SELECT app_version FROM profiles
             WHERE app_version ~ '^[0-9]+(\.[0-9]+)*$'
             ORDER BY string_to_array(app_version, '.')::int[] DESC
             LIMIT 1
        ),
        'versions', COALESCE((
            SELECT json_agg(json_build_object('version', version, 'count', count)
                            ORDER BY arr DESC)
              FROM (
                SELECT app_version AS version,
                       COUNT(*)    AS count,
                       string_to_array(app_version, '.')::int[] AS arr
                  FROM profiles
                 WHERE app_version ~ '^[0-9]+(\.[0-9]+)*$'
                 GROUP BY app_version
              ) v
        ), '[]'::json)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_app_version_summary(text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_app_version_summary(text) TO service_role;
