-- 20260603c_soma_atelier.sql
-- Atelier de Marketing — sección SOMA CERO (alimentos de alta conductividad,
-- Cancún). Tabla + RPCs admin para gestionar posts de Instagram de Soma Cero
-- (cerebro Gemini 3.5 Flash + visual Nano Banana 2). Stack 100% paralelo al de
-- VTLI (vtli_posts) — namespace propio para no mezclar la marca de alimentos con
-- la de cursos, y para escalar a futuros productos (hamburguesas, licuados,
-- postres) sin tocar nada de VTLI.
-- Aplicar pegando este archivo COMPLETO en Supabase Dashboard → SQL Editor →
-- New Query → Run.

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- Línea de producto. Hoy solo 'waffle' tiene contenido; los demás quedan
-- reservados para cuando lancen (evita un ALTER TYPE futuro).
DO $$ BEGIN
    CREATE TYPE soma_post_category AS ENUM (
        'waffle',
        'hamburguesa',
        'licuado',
        'postre'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE soma_post_status AS ENUM (
        'draft',      -- recién generado, esperando review
        'approved',   -- aprobado para publicar manual
        'rejected',   -- descartado
        'rerolled',   -- pidió reroll, este queda como padre del nuevo
        'published'   -- ya publicado en Instagram (marca manual posterior)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.soma_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category soma_post_category NOT NULL,
    target text NOT NULL,
    aha_moment text NOT NULL,
    prompt_visual text NOT NULL,
    caption text NOT NULL,
    hashtags text[] NOT NULL DEFAULT '{}',
    pulso_nucleo text,
    image_r2_url text,
    -- "prompts" = modo manual (el motor solo da el prompt, sin imagen por API);
    -- "api"/NULL = imagen generada por API. En modo prompts, image_r2_url se
    -- llena cuando se sube la imagen final como registro.
    image_mode text,
    is_published boolean NOT NULL DEFAULT false,
    status soma_post_status NOT NULL DEFAULT 'draft',
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    generated_by_clerk_id text NOT NULL,
    reroll_count int NOT NULL DEFAULT 0,
    parent_post_id uuid REFERENCES public.soma_posts(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    reviewed_by_clerk_id text
);

COMMENT ON TABLE public.soma_posts IS
    'Atelier de Marketing — posts de Instagram de SOMA CERO (alimentos, Cancún). Gemini 3.5 + Nano Banana 2. Lockdown via RLS sin policies; acceso solo por RPCs SECURITY DEFINER (frontend) o service_role (edge function generate-soma-posts).';

CREATE INDEX IF NOT EXISTS idx_soma_posts_category_status_generated
    ON public.soma_posts(category, status, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_soma_posts_status_generated
    ON public.soma_posts(status, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_soma_posts_parent
    ON public.soma_posts(parent_post_id)
    WHERE parent_post_id IS NOT NULL;

-- ============================================================
-- 3. RLS habilitado SIN POLICIES (lockdown total)
-- ============================================================

ALTER TABLE public.soma_posts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RPC: get_recent_soma_posts
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_soma_posts(
    p_admin_clerk_id text,
    p_category text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit int DEFAULT 60
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
        FROM public.soma_posts
        WHERE (p_category IS NULL OR category::text = p_category)
          AND (p_status IS NULL OR status::text = p_status)
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object('posts', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_soma_posts(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC: get_soma_posts_by_ids  (polling de imágenes)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_soma_posts_by_ids(
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
        FROM public.soma_posts
        WHERE id = ANY(p_ids)
        ORDER BY generated_at DESC
    ) sub;

    RETURN json_build_object('posts', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_soma_posts_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- ============================================================
-- 6. RPC: update_soma_post_status
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_soma_post_status(
    p_admin_clerk_id text,
    p_post_id uuid,
    p_new_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_id uuid;
    v_updated_status soma_post_status;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('approved', 'rejected', 'rerolled', 'published') THEN
        RETURN json_build_object('error', 'invalid_status');
    END IF;

    UPDATE public.soma_posts
    SET status = p_new_status::soma_post_status,
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_post_id
    RETURNING id, status
    INTO v_updated_id, v_updated_status;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'post_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'post_id', v_updated_id,
        'status', v_updated_status::text
    );
END $$;

GRANT EXECUTE ON FUNCTION public.update_soma_post_status(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 7. RPC: set_soma_post_published  (toggle manual de publicado)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_soma_post_published(
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

    UPDATE public.soma_posts
    SET is_published = COALESCE(p_published, false)
    WHERE id = p_post_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'post_not_found');
    END IF;

    RETURN json_build_object('success', true, 'post_id', v_updated_id);
END $$;

GRANT EXECUTE ON FUNCTION public.set_soma_post_published(text, uuid, boolean)
    TO anon, authenticated, service_role;

-- ============================================================
-- 8. RPC: get_soma_atelier_dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_soma_atelier_dashboard(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_month_start timestamptz;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_month_start := date_trunc('month', NOW());

    RETURN json_build_object(
        'is_admin', true,
        'month_generated_waffle', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE category = 'waffle' AND generated_at >= v_month_start
        ),
        'month_generated_total', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE generated_at >= v_month_start
        ),
        'month_approved', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_published', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime', (
            SELECT COUNT(*) FROM public.soma_posts
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_soma_atelier_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 9. RPC: increment_soma_post_reroll_count  (edge function)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_soma_post_reroll_count(
    p_post_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count int;
BEGIN
    UPDATE public.soma_posts
    SET reroll_count = reroll_count + 1
    WHERE id = p_post_id
    RETURNING reroll_count INTO v_new_count;

    RETURN COALESCE(v_new_count, 0);
END $$;

GRANT EXECUTE ON FUNCTION public.increment_soma_post_reroll_count(uuid)
    TO service_role;

-- ============================================================
-- 10. RPC: get_recent_soma_pulsos  (memoria anti-repetición)
-- Devuelve pulsos de los últimos posts APROBADOS de la línea de producto.
-- La edge function la llama con service_role antes de generar.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_soma_pulsos(
    p_category text,
    p_limit int DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_agg(pulso_nucleo ORDER BY reviewed_at DESC NULLS LAST)
    INTO v_result
    FROM (
        SELECT pulso_nucleo, reviewed_at
        FROM public.soma_posts
        WHERE status = 'approved'
          AND category::text = p_category
          AND pulso_nucleo IS NOT NULL
          AND length(trim(pulso_nucleo)) > 0
        ORDER BY reviewed_at DESC NULLS LAST
        LIMIT GREATEST(LEAST(p_limit, 50), 1)
    ) sub;

    RETURN json_build_object('pulsos', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_soma_pulsos(text, int)
    TO service_role;

-- ============================================================
-- 11. RPC: delete_soma_post
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_soma_post(
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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    DELETE FROM public.soma_posts WHERE id = p_post_id;
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

GRANT EXECUTE ON FUNCTION public.delete_soma_post(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260603c_soma_atelier.sql
--
-- Validar después de aplicar:
--   SELECT * FROM public.soma_posts LIMIT 0;
--   SELECT get_soma_atelier_dashboard(clerk_user_id)
--     FROM profiles WHERE is_admin = true LIMIT 1;
-- ============================================================
