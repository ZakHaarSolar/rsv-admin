-- Red Solar Viva · UNA VERSIÓN POR TIENDA (App Store · Google Play)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere: 20260629_app_release + 20260730_app_lockdown + 20260805b ya
-- aplicados.
--
-- POR QUÉ
--   El aviso de "hay una versión nueva" salía de UN número compartido por las
--   dos tiendas, y las dos no aprueban al mismo ritmo: Google Play publica en
--   una hora, Apple puede tardar un día. Con un solo número había que elegir
--   entre dos males: publicarlo temprano y mandar a los de una tienda a una
--   ficha donde todavía no hay nada que instalar, o esperar a la más lenta y
--   dejar sin avisar a quien ya podía actualizar.
--   Ahora cada tienda lleva su propio número y cada aparato compara contra el
--   suyo: en cuanto una versión sale en Play, los de Android se enteran, sin
--   esperar a Apple. Y al revés.
--
-- COMPATIBILIDAD
--   `latest_version_android` vacío = "usa el de iPhone" (comportamiento de
--   siempre). Los builds ya publicados ignoran la clave nueva del json y
--   siguen leyendo `latest_version`, así que nada se rompe mientras el build
--   con el cambio llega a las tiendas.
--
-- EL BLOQUEO DE EMERGENCIA NO SE PARTE a propósito: la numeración de versión
--   es la MISMA para las dos tiendas (mismo código), así que "frenar todo lo
--   anterior a 1.1.5" quiere decir lo mismo en las dos. Lo que difiere es
--   cuál está publicada, no cuál tiene el problema.

ALTER TABLE public.app_release
    ADD COLUMN IF NOT EXISTS latest_version_android text NOT NULL DEFAULT '';

-- La bitácora distingue de qué tienda fue el movimiento.
ALTER TABLE public.app_release_log
    ADD COLUMN IF NOT EXISTS store text NOT NULL DEFAULT '';

-- ════════════════════════════════════════════════════════════════════
-- 1) Lectura pública — suma la clave nueva (misma firma → REPLACE directo).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_app_release()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'latest_version', latest_version,
        'latest_version_android', latest_version_android,
        'message', message,
        'store_url', store_url,
        'force', force,
        'lock_active', lock_active,
        'lock_min_version', lock_min_version,
        'lock_message', lock_message
    )
    FROM app_release WHERE id = 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_app_release() TO anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 2) Escritura admin — gana p_latest_version_android y anota POR TIENDA.
-- ════════════════════════════════════════════════════════════════════
-- ⚠️ Se DROPEA la firma de 5 argumentos: sumar un parámetro con default crea
-- una SOBRECARGA y una llamada de 5 matchearía las dos ("function is not
-- unique"). Tiene que quedar una sola. El panel del Motor manda los
-- argumentos por NOMBRE, así que una versión suya que aún no conozca el campo
-- nuevo sigue funcionando (cae en el default y no toca Android).
DROP FUNCTION IF EXISTS public.admin_set_app_release(text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_set_app_release(
    p_admin_clerk_id       text,
    p_latest_version       text,
    p_message              text,
    p_store_url            text,
    p_force                boolean,
    p_latest_version_android text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prev_ios text;
    v_prev_and text;
    v_now_ios  text;
    v_now_and  text;
    v_email    text;
    v_msg      text := COALESCE(NULLIF(TRIM(p_message), ''), '');
    v_anotado  boolean := false;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT latest_version, latest_version_android
      INTO v_prev_ios, v_prev_and
      FROM app_release WHERE id = 1;

    UPDATE app_release SET
        latest_version = COALESCE(NULLIF(TRIM(p_latest_version), ''), latest_version),
        -- Android admite VACIARSE a propósito (vacío = "usa el de iPhone"),
        -- así que NULL significa "no lo toques" y '' significa "límpialo".
        latest_version_android = CASE
            WHEN p_latest_version_android IS NULL THEN latest_version_android
            ELSE TRIM(p_latest_version_android)
        END,
        message        = COALESCE(NULLIF(TRIM(p_message), ''), message),
        store_url      = COALESCE(NULLIF(TRIM(p_store_url), ''), store_url),
        force          = COALESCE(p_force, false),
        updated_at     = now()
    WHERE id = 1;

    SELECT latest_version, latest_version_android
      INTO v_now_ios, v_now_and
      FROM app_release WHERE id = 1;
    SELECT COALESCE(email, '') INTO v_email FROM profiles WHERE clerk_user_id = p_admin_clerk_id;

    BEGIN
        IF COALESCE(v_now_ios, '') IS DISTINCT FROM COALESCE(v_prev_ios, '') THEN
            INSERT INTO app_release_log (kind, store, version, version_prev, message, admin_email)
            VALUES ('version', 'ios', COALESCE(v_now_ios, ''), COALESCE(v_prev_ios, ''), v_msg, COALESCE(v_email, ''));
            v_anotado := true;
        END IF;
        IF COALESCE(v_now_and, '') IS DISTINCT FROM COALESCE(v_prev_and, '') THEN
            INSERT INTO app_release_log (kind, store, version, version_prev, message, admin_email)
            VALUES ('version', 'android', COALESCE(v_now_and, ''), COALESCE(v_prev_and, ''), v_msg, COALESCE(v_email, ''));
            v_anotado := true;
        END IF;
        -- Nada cambió de número: fue un ajuste del mensaje. Se anota igual,
        -- para que la bitácora no tenga huecos.
        IF NOT v_anotado THEN
            INSERT INTO app_release_log (kind, store, version, version_prev, message, admin_email)
            VALUES ('mensaje', '', COALESCE(v_now_ios, ''), COALESCE(v_now_ios, ''), v_msg, COALESCE(v_email, ''));
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- La bitácora nunca puede impedir que se publique una versión.
        NULL;
    END;

    RETURN (SELECT get_app_release());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_app_release(text, text, text, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_app_release(text, text, text, text, boolean, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 3) Lectura de la bitácora — suma la columna `store`.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_app_release_log(
    p_admin_clerk_id text,
    p_limit          int DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lim int := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN COALESCE(
        (SELECT json_agg(row_to_json(l) ORDER BY l.created_at DESC, l.id DESC)
           FROM (
                SELECT id, kind, store, version, version_prev, min_version,
                       message, admin_email, created_at
                FROM app_release_log
                ORDER BY created_at DESC, id DESC
                LIMIT v_lim
           ) l),
        '[]'::json
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_app_release_log(text, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_app_release_log(text, int) TO service_role;

-- Verificar:
--   SELECT get_app_release();
--   SELECT id, kind, store, version, version_prev, created_at FROM app_release_log ORDER BY id DESC LIMIT 10;
