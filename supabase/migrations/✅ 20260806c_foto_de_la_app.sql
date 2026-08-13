-- Red Solar Viva · LA FOTO QUE LA PERSONA ELIGIÓ (2026-08-06)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente. Misma firma → NO requiere redeploy de admin-action.
--
-- 🜂 EL CASO (Zak): en la ficha del nodo apareció una foto VIEJA de Aqua'Riia
-- —no la que ella subió desde su perfil—. La causa: la ficha leía la imagen
-- de CLERK, que es la que quedó al identificarse (o la que alguien puso hace
-- mucho) y que ya nadie actualiza. La foto viva vive en otro lado: la que el
-- Tripulante elige dentro de la app se guarda en `community_profiles.photo_url`.
--
-- Esta RPC devuelve las dos y deja que el panel prefiera la de la app. Se
-- devuelve también `show_photo` —su preferencia de mostrarla a OTROS
-- Tripulantes— no para filtrar, sino para que el panel pueda decirlo: el
-- panel de administración ya ve nombre y correo, pero saber que alguien
-- eligió no mostrarse en público es contexto que merece verse.

CREATE OR REPLACE FUNCTION public.get_tripulante_foto(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    foto_app   TEXT,
    show_photo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        NULLIF(BTRIM(COALESCE(cp.photo_url, '')), ''),
        COALESCE(cp.show_photo, false)
    FROM public.community_profiles cp
    WHERE cp.clerk_user_id = target_clerk_id
    LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tripulante_foto(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_tripulante_foto(TEXT, TEXT)
    TO service_role;
