-- 20260526d_vtli_delete_post.sql
-- RPC para borrar posts directamente desde el panel del Atelier.
-- Útil cuando un post queda atascado en "Materializando" (la imagen
-- falló silenciosa en background) o cuando Zak quiere limpiar
-- placeholders huérfanos sin pasar por SQL Editor.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor →
-- New Query → Run.

CREATE OR REPLACE FUNCTION public.delete_vtli_post(
    p_admin_clerk_id text,
    p_post_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_deleted_count int;
BEGIN
    -- Admin gate
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    DELETE FROM public.vtli_posts WHERE id = p_post_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RETURN json_build_object('error', 'post_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'post_id', p_post_id,
        'deleted_count', v_deleted_count
    );
END $$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_post(text, uuid)
    TO anon, authenticated, service_role;

-- Validar:
--   SELECT delete_vtli_post(
--       (SELECT clerk_user_id FROM profiles WHERE is_admin = true LIMIT 1),
--       gen_random_uuid()  -- UUID inexistente
--   );
--   → Debe devolver {"error":"post_not_found"} (no rompe)
