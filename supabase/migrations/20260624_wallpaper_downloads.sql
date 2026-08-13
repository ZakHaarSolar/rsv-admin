-- Red Solar Viva · Telemetría de descargas de Anclajes Fotónicos (wallpapers)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Crea:
--   · wallpaper_downloads (1 fila por guardado a Fotos; RLS-locked, solo RPCs).
--   · record_wallpaper_download(p_clerk_user_id, p_wallpaper_id) — el gateway
--     user-action inyecta el id verificado del Tripulante (el cliente solo manda
--     el id del fondo). Fire-and-forget desde la app al guardar.
--   · get_wallpaper_download_telemetry(admin_clerk_id, p_exclude) — agregado por
--     wallpaper (cuáles se descargan más) para el panel del Motor; excluye las
--     mismas cuentas internas que la Telemetría de Navegación cuando p_exclude.

-- ── Tabla ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallpaper_downloads (
    id            bigserial PRIMARY KEY,
    clerk_user_id text NOT NULL,
    wallpaper_id  uuid NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wp_dl_wallpaper ON public.wallpaper_downloads(wallpaper_id);
CREATE INDEX IF NOT EXISTS idx_wp_dl_user      ON public.wallpaper_downloads(clerk_user_id);

ALTER TABLE public.wallpaper_downloads ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER + service_role.)

-- ── Registrar una descarga (usuario; id inyectado por user-action) ───
CREATE OR REPLACE FUNCTION record_wallpaper_download(
    p_clerk_user_id TEXT,
    p_wallpaper_id  UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' OR p_wallpaper_id IS NULL THEN
        RETURN;
    END IF;
    INSERT INTO public.wallpaper_downloads (clerk_user_id, wallpaper_id)
    VALUES (p_clerk_user_id, p_wallpaper_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION record_wallpaper_download(TEXT, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_wallpaper_download(TEXT, UUID) TO service_role;

-- ── Telemetría agregada (admin; excluye cuentas internas) ────────────
CREATE OR REPLACE FUNCTION get_wallpaper_download_telemetry(
    admin_clerk_id TEXT,
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
        SELECT d.*
        FROM wallpaper_downloads d
        WHERE (NOT p_exclude OR d.clerk_user_id NOT IN (SELECT clerk_user_id FROM excl))
    )
    SELECT json_build_object(
        'total_downloads', (SELECT COUNT(*) FROM base),
        'total_users',     (SELECT COUNT(DISTINCT clerk_user_id) FROM base),
        'wallpapers', COALESCE((
            SELECT json_agg(row_to_json(w) ORDER BY w.downloads DESC, w.last_at DESC)
            FROM (
                SELECT
                    wp.id,
                    wp.title,
                    wp.image_url,
                    wp.is_free,
                    wp.active,
                    COUNT(b.id)::INT             AS downloads,
                    COUNT(DISTINCT b.clerk_user_id)::INT AS users,
                    MAX(b.created_at)            AS last_at
                FROM wallpapers wp
                JOIN base b ON b.wallpaper_id = wp.id
                GROUP BY wp.id, wp.title, wp.image_url, wp.is_free, wp.active
            ) w
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_wallpaper_download_telemetry(TEXT, BOOLEAN)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_wallpaper_download_telemetry(TEXT, BOOLEAN) TO service_role;
