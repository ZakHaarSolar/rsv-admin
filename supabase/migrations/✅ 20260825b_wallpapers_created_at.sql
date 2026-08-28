-- Red Solar Viva · get_wallpapers devuelve created_at (Zak 2026-08-25)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Por qué: la galería estrena una pestaña "Recientes" que ordena por fecha
-- de alta y marca como NUEVO lo subido después de la última visita. La
-- columna existe desde el día uno en la tabla; simplemente nunca viajaba al
-- cliente. Esto NO cambia nada más: mismos campos, mismo orden, mismo grant.

CREATE OR REPLACE FUNCTION public.get_wallpapers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'id', id, 'title', title, 'title_en', title_en, 'image_url', image_url,
        'is_free', is_free, 'sort_order', sort_order, 'category_id', category_id,
        'created_at', created_at
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM public.wallpapers
    WHERE active = true;

    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_wallpapers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_wallpapers() TO anon, authenticated, service_role;
