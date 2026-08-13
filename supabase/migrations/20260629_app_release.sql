-- Red Solar Viva · app_release — aviso "hay una nueva versión" controlado desde el Motor
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- La app lee `get_app_release()` al arrancar. Si su versión (lib/appVersion.ts)
-- es MENOR que `latest_version`, muestra una tarjeta "Nueva versión disponible →
-- Actualizar" que abre la App Store (`store_url`). Desde el Motor (pestaña "App")
-- el admin fija la última versión + el mensaje. `force=true` lo vuelve insistente
-- (se muestra cada arranque); en false el Tripulante lo puede posponer.
--
-- Es info pública (sin PII) → get_app_release es anon-legible. El SET es admin.

CREATE TABLE IF NOT EXISTS public.app_release (
    id             int PRIMARY KEY DEFAULT 1,
    latest_version text NOT NULL DEFAULT '1.0.5',
    message        text NOT NULL DEFAULT 'Hay una nueva versión del Escáner con mejoras. Actualiza para tener la mejor experiencia.',
    store_url      text NOT NULL DEFAULT 'https://apps.apple.com/app/id0000000000',
    force          boolean NOT NULL DEFAULT false,
    updated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT app_release_singleton CHECK (id = 1)
);

INSERT INTO public.app_release (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (la app la consulta al arrancar, incluso sin sesión).
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
        'force', force
    )
    FROM app_release WHERE id = 1;
$$;

-- Escritura admin (por el gateway admin-action).
CREATE OR REPLACE FUNCTION public.admin_set_app_release(
    p_admin_clerk_id text,
    p_latest_version text,
    p_message        text,
    p_store_url      text,
    p_force          boolean
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

    UPDATE app_release SET
        latest_version = COALESCE(NULLIF(TRIM(p_latest_version), ''), latest_version),
        message        = COALESCE(NULLIF(TRIM(p_message), ''), message),
        store_url      = COALESCE(NULLIF(TRIM(p_store_url), ''), store_url),
        force          = COALESCE(p_force, false),
        updated_at     = now()
    WHERE id = 1;

    RETURN (SELECT get_app_release());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_app_release(text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_app_release(text, text, text, text, boolean) TO service_role;
-- get_app_release SÍ queda legible por anon (catálogo público, sin PII).
GRANT  EXECUTE ON FUNCTION public.get_app_release() TO anon, authenticated, service_role;
