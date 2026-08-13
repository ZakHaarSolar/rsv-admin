-- Red Solar Viva · app_flags — banderas de configuración globales del Motor
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Tabla genérica clave→booleano para feature-flags controlados por el admin
-- desde el Motor de Intervención. Primer uso: 'hide_camara_solar' — cuando está
-- en true, la web oculta la Cámara Solar (sesiones grupales) de /sesiones y su
-- pestaña en Mi Núcleo. Es info pública (sin PII) → get_app_flag es anon-legible;
-- el SET es admin (por el gateway admin-action, que inyecta p_admin_clerk_id).

CREATE TABLE IF NOT EXISTS public.app_flags (
    key        text PRIMARY KEY,
    value      boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_flags (key, value) VALUES ('hide_camara_solar', false)
ON CONFLICT (key) DO NOTHING;

-- Lectura pública (las páginas la consultan al cargar, incluso sin sesión).
CREATE OR REPLACE FUNCTION public.get_app_flag(p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT value FROM app_flags WHERE key = p_key), false);
$$;

-- Escritura admin (por el gateway admin-action; inyecta p_admin_clerk_id verificado).
CREATE OR REPLACE FUNCTION public.admin_set_app_flag(
    p_admin_clerk_id text,
    p_key   text,
    p_value boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    INSERT INTO app_flags (key, value, updated_at)
    VALUES (p_key, COALESCE(p_value, false), now())
    ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = now();

    RETURN COALESCE(p_value, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_app_flag(text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_app_flag(text, text, boolean) TO service_role;
-- get_app_flag SÍ queda legible por anon (feature flag público, sin PII).
GRANT  EXECUTE ON FUNCTION public.get_app_flag(text) TO anon, authenticated, service_role;
