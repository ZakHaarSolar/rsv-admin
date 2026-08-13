-- 20260526c_vtli_get_posts_by_ids.sql
-- RPC para fetch específico de posts por array de UUIDs. La usa el
-- frontend del Atelier para hacer polling sobre los placeholders
-- recién creados (image_r2_url null) hasta que la edge function
-- background termine de generar cada imagen y popular la URL.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor →
-- New Query → Run.

CREATE OR REPLACE FUNCTION public.get_vtli_posts_by_ids(
    p_admin_clerk_id text,
    p_ids uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result json;
BEGIN
    -- Admin gate
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
        RETURN json_build_object('posts', '[]'::json);
    END IF;

    SELECT json_agg(row_to_json(sub) ORDER BY sub.generated_at DESC)
    INTO v_result
    FROM (
        SELECT
            id,
            category::text AS category,
            target,
            aha_moment,
            prompt_visual,
            caption,
            hashtags,
            pulso_nucleo,
            image_r2_url,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_post_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_posts
        WHERE id = ANY(p_ids)
    ) sub;

    RETURN json_build_object(
        'posts', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_posts_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- Validar:
--   SELECT get_vtli_posts_by_ids(
--       (SELECT clerk_user_id FROM profiles WHERE is_admin = true LIMIT 1),
--       ARRAY[]::uuid[]
--   );
--   → Debe devolver {"posts": []}
