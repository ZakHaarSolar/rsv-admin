-- 20260603b_vtli_posts_manual.sql
-- Atelier de Marketing (posts VTLI) — MODO MANUAL ("solo prompts") + PUBLICADO.
--   (1) image_mode: 'prompts' = el motor solo arma el prompt (Zak genera la
--       imagen a mano en Nano Banana, $0); 'api'/NULL = comportamiento normal.
--   (2) is_published: marca manual para diferenciar los posts ya publicados.
--   Cuando un post manual recibe su imagen subida, va a image_r2_url (la misma
--       columna) — el panel muestra la imagen en vez del prompt.
-- Aplicar pegando este archivo COMPLETO en Supabase Dashboard → SQL Editor → Run.

-- ============================================================
-- 1. COLUMNAS NUEVAS
-- ============================================================

ALTER TABLE public.vtli_posts
    ADD COLUMN IF NOT EXISTS image_mode text,
    ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vtli_posts.image_mode IS
    '"prompts" = generación manual (el motor solo da el prompt, sin imagen por API); "api"/NULL = imagen generada por API. En modo prompts, image_r2_url se llena cuando Zak sube la imagen final como registro.';
COMMENT ON COLUMN public.vtli_posts.is_published IS
    'Marca manual: este post ya se publicó en Instagram. Ortogonal al status.';

-- ============================================================
-- 2. get_recent_vtli_posts — + image_mode + is_published + pulso_nucleo
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_vtli_posts(
    p_admin_clerk_id text,
    p_category text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit int DEFAULT 30
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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
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
            image_mode,
            is_published,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_post_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_posts
        WHERE (p_category IS NULL OR category::text = p_category)
          AND (p_status IS NULL OR status::text = p_status)
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object('posts', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_posts(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 3. get_vtli_posts_by_ids — + image_mode + is_published
-- ============================================================

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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
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
            image_mode,
            is_published,
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

    RETURN json_build_object('posts', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_posts_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- ============================================================
-- 4. set_vtli_post_published — toggle de la marca Publicado (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_vtli_post_published(
    p_admin_clerk_id text,
    p_post_id uuid,
    p_published boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_id uuid;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.vtli_posts
    SET is_published = COALESCE(p_published, false)
    WHERE id = p_post_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'post_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'post_id', v_updated_id,
        'is_published', COALESCE(p_published, false)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.set_vtli_post_published(text, uuid, boolean)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260603b_vtli_posts_manual.sql
--
-- Validar tras aplicar:
--   SELECT image_mode, is_published FROM public.vtli_posts LIMIT 0;
-- ============================================================
