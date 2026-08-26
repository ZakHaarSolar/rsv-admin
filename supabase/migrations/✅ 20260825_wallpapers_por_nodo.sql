-- Red Solar Viva · Qué wallpapers descargó CADA tripulante (Zak 2026-08-25)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- La Telemetría ya dice cuáles fondos se descargan más (agregado global);
-- esta RPC responde la otra mitad: dado UN nodo, qué fondos se llevó, cuántas
-- veces y cuándo. La consume la ficha del nodo en el Motor (MI_Detail), bajo
-- demanda: solo cuando el admin toca "Ver wallpapers descargados".

CREATE OR REPLACE FUNCTION admin_get_user_wallpapers(
    target_clerk_id  TEXT,
    p_admin_clerk_id TEXT
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
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT COALESCE(json_agg(t ORDER BY t.ultima DESC), '[]'::json)
    INTO result
    FROM (
        SELECT
            w.id,
            w.title,
            w.image_url,
            COUNT(*)::INT      AS veces,
            MIN(d.created_at)  AS primera,
            MAX(d.created_at)  AS ultima
        FROM wallpaper_downloads d
        JOIN wallpapers w ON w.id = d.wallpaper_id
        WHERE d.clerk_user_id = target_clerk_id
        GROUP BY w.id, w.title, w.image_url
    ) t;

    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_user_wallpapers(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_wallpapers(TEXT, TEXT)
    TO service_role;
