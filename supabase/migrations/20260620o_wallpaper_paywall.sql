-- Red Solar Viva · AUDITORÍA 2026-06-20 · Muro de pago de Wallpapers server-side
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Luego: supabase functions deploy user-action --no-verify-jwt
--
-- PROBLEMA (auditoría): get_wallpapers() era anon y devolvía la URL full-res de
-- TODOS los wallpapers, incluidos los de paga (is_free=false). El muro de
-- Sintonía 599 estaba solo en el cliente (CSS) → cualquiera con la llave
-- pública bajaba los fondos premium gratis.
--
-- FIX: get_wallpapers pasa a ser member-aware y se sirve SOLO por el gateway
-- user-action (id verificado inyectado). Devuelve la URL full-res únicamente
-- para los fondos GRATIS o si el caller es miembro (Sintonía/Inmersión); para
-- los bloqueados devuelve image_url=null + locked=true (el cliente muestra una
-- tarjeta con candado, sin filtrar el archivo). La feature de Wallpapers aún
-- NO está publicada (viaja en el próximo build), así que cambiar la firma no
-- rompe nada vivo.
--
-- Reusa el mismo criterio de membresía que las Calibraciones
-- (get_my_membership_tier → 'sintonia' | 'inmersion').

-- La versión anon sin argumentos se elimina (se reemplaza por la member-aware).
DROP FUNCTION IF EXISTS public.get_wallpapers();

CREATE OR REPLACE FUNCTION public.get_wallpapers(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member boolean;
    result json;
BEGIN
    v_member := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier')
                IN ('sintonia', 'inmersion');

    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        -- URL full-res SOLO para gratis o miembro; bloqueado → null (sin fuga).
        'image_url', CASE WHEN is_free OR v_member THEN image_url ELSE NULL END,
        'is_free', is_free,
        'locked', NOT (is_free OR v_member),
        'sort_order', sort_order,
        'category_id', category_id
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM wallpapers
    WHERE active;

    RETURN result;
END;
$$;

-- Solo el gateway (service_role) la invoca; anon ya no puede leer URLs de paga.
REVOKE EXECUTE ON FUNCTION public.get_wallpapers(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_wallpapers(text) TO service_role;

NOTIFY pgrst, 'reload schema';
