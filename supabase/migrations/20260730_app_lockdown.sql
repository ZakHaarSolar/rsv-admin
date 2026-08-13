-- Red Solar Viva · BLOQUEO DE EMERGENCIA de la app (freno de mano del Motor)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Pantalla sin salida al abrir la app (mensaje del admin + botón a la App
-- Store) para frenar un gasto desbocado o una fuga SIN esperar una revisión de
-- Apple. Tres decisiones de diseño (las "3 condiciones"):
--   (1) POR VERSIÓN MÍNIMA, no a todos por igual: bloquea SOLO a quien corre
--       una versión ANTERIOR a lock_min_version. Así, publicada la versión
--       arreglada, quien actualiza queda libre y las versiones con el problema
--       siguen frenadas. Para bloquear TODO lo publicado se pone una versión
--       mínima más alta que cualquier build vivo (p. ej. 9.9.9).
--   (2) FAIL-OPEN (vive en el cliente): si la app no puede leer este estado
--       (sin red, servidor caído), DEJA PASAR. Un bloqueo que se dispara solo
--       por una caída de red sería peor que lo que viene a evitar.
--   (3) Se prueba en TestFlight/device ANTES de operarlo en producción.
--
-- Vive en app_release (la misma fila que el aviso de versión) → el cliente lo
-- lee en la MISMA llamada get_app_release() que ya hace al arrancar: cero
-- peticiones nuevas. Los builds publicados ignoran las claves extra del json.

ALTER TABLE public.app_release
    ADD COLUMN IF NOT EXISTS lock_active      boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS lock_min_version text    NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS lock_message     text    NOT NULL DEFAULT '';

-- Lectura pública ampliada (misma firma → CREATE OR REPLACE directo).
CREATE OR REPLACE FUNCTION public.get_app_release()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'latest_version', latest_version,
        'message', message,
        'store_url', store_url,
        'force', force,
        'lock_active', lock_active,
        'lock_min_version', lock_min_version,
        'lock_message', lock_message
    )
    FROM app_release WHERE id = 1;
$$;

-- Escritura admin del bloqueo (por el gateway admin-action; requiere v1.44).
CREATE OR REPLACE FUNCTION public.admin_set_app_lockdown(
    p_admin_clerk_id text,
    p_active         boolean,
    p_min_version    text,
    p_message        text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Activar EXIGE una versión mínima real: un bloqueo sin versión no
    -- sabría a quién frenar y el cliente lo ignoraría (fail-open).
    IF COALESCE(p_active, false) = true
       AND COALESCE(NULLIF(TRIM(p_min_version), ''), '') = '' THEN
        RETURN json_build_object('error', 'missing_min_version');
    END IF;

    UPDATE app_release SET
        lock_active      = COALESCE(p_active, false),
        lock_min_version = COALESCE(TRIM(p_min_version), lock_min_version),
        lock_message     = COALESCE(NULLIF(TRIM(p_message), ''), lock_message),
        updated_at       = now()
    WHERE id = 1;

    RETURN (SELECT get_app_release());
END;
$$;

-- Candados (regla de oro: re-afirmar tras cada CREATE OR REPLACE).
REVOKE EXECUTE ON FUNCTION public.admin_set_app_lockdown(text, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_app_lockdown(text, boolean, text, text) TO service_role;
-- get_app_release sigue siendo catálogo público (sin PII).
GRANT  EXECUTE ON FUNCTION public.get_app_release() TO anon, authenticated, service_role;
