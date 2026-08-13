-- 20260526_vtli_atelier_posts.sql
-- Atelier de Marketing — tabla + RPCs admin para gestionar posts
-- generados de Instagram VTLI (cerebro Gemini 3.5 Flash + visual
-- Nano Banana 2). Aplicar pegando este archivo completo en
-- Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE vtli_post_category AS ENUM ('veo', 'telekinesis');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE vtli_post_status AS ENUM (
        'draft',      -- recién generado, esperando review
        'approved',   -- Zak aprobó para publicar manual
        'rejected',   -- Zak descartó
        'rerolled',   -- Zak pidió reroll, este queda como padre del nuevo
        'published'   -- ya publicado en Instagram (marca manual posterior)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vtli_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category vtli_post_category NOT NULL,
    target text NOT NULL,
    aha_moment text NOT NULL,
    prompt_visual text NOT NULL,
    caption text NOT NULL,
    hashtags text[] NOT NULL DEFAULT '{}',
    image_r2_url text,
    status vtli_post_status NOT NULL DEFAULT 'draft',
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    generated_by_clerk_id text NOT NULL,
    reroll_count int NOT NULL DEFAULT 0,
    parent_post_id uuid REFERENCES public.vtli_posts(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    reviewed_by_clerk_id text
);

COMMENT ON TABLE public.vtli_posts IS
    'Atelier de Marketing — posts generados de Instagram VTLI con Gemini 3.5 + Nano Banana 2. Lockdown via RLS sin policies, acceso solo por RPCs SECURITY DEFINER (frontend) o service_role (edge function generate-vtli-posts).';

COMMENT ON COLUMN public.vtli_posts.parent_post_id IS
    'Si este post nació de un reroll, apunta al post original. Padre típicamente queda con status=''rerolled''.';

COMMENT ON COLUMN public.vtli_posts.image_r2_url IS
    'URL pública R2 con la imagen 3:4 generada por Nano Banana 2 (1080p). Path: posts/{YYYY-MM-DD}/{uuid}.png';

-- Índices para queries comunes del panel
CREATE INDEX IF NOT EXISTS idx_vtli_posts_category_status_generated
    ON public.vtli_posts(category, status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_posts_status_generated
    ON public.vtli_posts(status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_posts_parent
    ON public.vtli_posts(parent_post_id)
    WHERE parent_post_id IS NOT NULL;

-- ============================================================
-- 3. RLS habilitado SIN POLICIES (lockdown total)
-- Solo edge function (service_role) o RPCs SECURITY DEFINER pueden tocarla.
-- ============================================================

ALTER TABLE public.vtli_posts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RPC: get_recent_vtli_posts
-- Devuelve los N posts más recientes, filtrables por categoría y status.
-- Admin-only via profiles.is_admin.
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
    -- Admin gate
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Query filtrada
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
            image_r2_url,
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

    RETURN json_build_object(
        'posts', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_posts(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC: update_vtli_post_status
-- Aprobar / rechazar / marcar como rerolled o published.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_vtli_post_status(
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
    v_updated_status vtli_post_status;
BEGIN
    -- Admin gate
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Validar nuevo status
    IF p_new_status NOT IN ('approved', 'rejected', 'rerolled', 'published') THEN
        RETURN json_build_object('error', 'invalid_status');
    END IF;

    -- Update
    UPDATE public.vtli_posts
    SET status = p_new_status::vtli_post_status,
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

GRANT EXECUTE ON FUNCTION public.update_vtli_post_status(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 6. RPC: get_atelier_dashboard
-- Métricas del panel: counts del mes actual + total histórico.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_atelier_dashboard(
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
    -- Admin gate
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_month_start := date_trunc('month', NOW());

    RETURN json_build_object(
        'is_admin', true,
        'month_generated_veo', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE category = 'veo' AND generated_at >= v_month_start
        ),
        'month_generated_telekinesis', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE category = 'telekinesis' AND generated_at >= v_month_start
        ),
        'month_approved', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_rejected', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'rejected' AND reviewed_at >= v_month_start
        ),
        'month_rerolled', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'rerolled' AND reviewed_at >= v_month_start
        ),
        'month_published', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime', (
            SELECT COUNT(*) FROM public.vtli_posts
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_atelier_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 7. RPC: increment_vtli_post_reroll_count
-- Util para la edge function: cuando crea un post hijo via reroll,
-- incrementa el contador del padre antes de marcarlo 'rerolled'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_vtli_post_reroll_count(
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
    UPDATE public.vtli_posts
    SET reroll_count = reroll_count + 1
    WHERE id = p_post_id
    RETURNING reroll_count INTO v_new_count;

    RETURN COALESCE(v_new_count, 0);
END $$;

GRANT EXECUTE ON FUNCTION public.increment_vtli_post_reroll_count(uuid)
    TO service_role;

-- ============================================================
-- Fin de migración 20260526_vtli_atelier_posts.sql
--
-- Después de aplicar, validar con dos queries rápidas:
--   SELECT * FROM public.vtli_posts LIMIT 0;
--   SELECT get_atelier_dashboard(clerk_user_id)
--     FROM profiles WHERE is_admin = true LIMIT 1;
-- ============================================================
