-- 20260720b_correos_solo_optin.sql — El padrón de Correos deja FUERA las
-- cuentas de la app (profiles) y todo correo de prueba.
--
-- Feedback de Zak (2026-07-20): en la pestaña Correos aparecían montones de
-- correos *+clerk_test@example.com — son las cuentas de PRUEBA de Clerk que
-- viven en profiles (verificaciones de preview/dev comparten el Supabase de
-- prod). Además, quien solo tiene cuenta en la app nunca dio opt-in a recibir
-- avisos por correo. Decisión: el padrón une SOLO lista de Android + Nodo
-- Central (newsletter) + pases de Cámara Solar; profiles ya no participa, y
-- por defensa se filtra cualquier @example.com / clerk_test en TODOS los
-- orígenes.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
-- (Si la 20260720_android_waitlist.sql aún NO se pegó, pegar SOLO aquella:
--  ya quedó corregida con esta misma versión de la función.)

CREATE OR REPLACE FUNCTION public.admin_get_subscribers(
    p_admin_clerk_id text,
    p_only_android   boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN (
        WITH internas AS (
            -- Cuentas propias: no son audiencia (mismo criterio que la
            -- Telemetría de Navegación).
            SELECT unnest(ARRAY[
                'cuerpodeluz555@gmail.com',
                'zakhaarsol@pm.me',
                'redsolarviva@pm.me',
                'veocancun@gmail.com',
                'veotuluzinterna@gmail.com',
                'diegosotoborja@gmail.com',
                'zakhaar@pm.me'
            ]) AS email
        ),
        fuentes AS (
            -- La lista de Android (la landing).
            SELECT lower(trim(w.email))  AS email,
                   'android'::text       AS origen,
                   w.created_at          AS fecha,
                   w.notified_at         AS avisado
            FROM android_waitlist w
            WHERE w.email IS NOT NULL AND trim(w.email) <> ''

            UNION ALL

            -- NODO CENTRAL: el newsletter del Portal de Inducción (opt-in
            -- explícito: la persona se apuntó justamente para recibir avisos).
            SELECT lower(trim(nc.email)) AS email,
                   'nodo'::text          AS origen,
                   nc.subscribed_at      AS fecha,
                   NULL::timestamptz     AS avisado
            FROM nodo_central nc
            WHERE NOT p_only_android
              AND nc.email IS NOT NULL AND trim(nc.email) <> ''

            UNION ALL

            -- Cámara Solar grupal (pases de exploración). Su fecha es la de
            -- la sesión (event_date), la tabla no lleva created_at.
            -- NOTA: profiles (cuentas de la app) ya NO participa — tener
            -- cuenta no es opt-in a correos, y ahí vivían las cuentas de
            -- prueba *+clerk_test@example.com.
            SELECT lower(trim(ep.email))     AS email,
                   'camara'::text            AS origen,
                   ep.event_date::timestamptz AS fecha,
                   NULL::timestamptz         AS avisado
            FROM exploration_passes ep
            WHERE NOT p_only_android
              AND ep.email IS NOT NULL AND trim(ep.email) <> ''
        ),
        deduped AS (
            -- Un correo = una fila. Si está en varias fuentes gana la de
            -- intención más explícita (android > newsletter > pase) y se
            -- conserva la fecha más vieja. Defensa global: fuera correos de
            -- prueba (@example.com / clerk_test) vengan del origen que vengan.
            SELECT
                f.email,
                CASE WHEN bool_or(f.origen = 'android') THEN 'android'
                     WHEN bool_or(f.origen = 'nodo')    THEN 'nodo'
                     ELSE 'camara' END                       AS origen,
                min(f.fecha)                                 AS fecha,
                max(f.avisado)                               AS avisado,
                bool_or(f.origen = 'android')                AS en_android,
                bool_or(f.origen = 'nodo')                   AS en_newsletter
            FROM fuentes f
            WHERE f.email NOT IN (SELECT email FROM internas)
              AND f.email NOT LIKE '%@example.com'
              AND f.email NOT LIKE '%clerk_test%'
              AND NOT EXISTS (
                  SELECT 1 FROM email_opt_outs o
                  WHERE lower(trim(o.email)) = f.email
              )
            GROUP BY f.email
        )
        SELECT json_build_object(
            'total',       (SELECT count(*) FROM deduped),
            'android',     (SELECT count(*) FROM deduped WHERE en_android),
            'newsletter',  (SELECT count(*) FROM deduped WHERE en_newsletter),
            'rows',        COALESCE((
                SELECT json_agg(row_to_json(d) ORDER BY d.fecha DESC NULLS LAST)
                FROM deduped d
            ), '[]'::json)
        )
    );
END;
$$;

-- Re-afirmar permisos (patrón de la casa: todo CREATE OR REPLACE re-sella).
REVOKE ALL ON FUNCTION public.admin_get_subscribers(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_subscribers(text, boolean) TO service_role;

NOTIFY pgrst, 'reload schema';
