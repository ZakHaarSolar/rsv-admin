-- 20260526e_vtli_videos.sql
-- Atelier de Marketing — Video. Tabla + RPCs admin para gestionar
-- videos Reels generados con Gemini 3.5 (copy) + Replicate Seedance 2.0
-- a 720p 9:16 5s (~$0.90 USD/video). Aplicar pegando este archivo
-- completo en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Decisión arquitectónica: tabla NUEVA `vtli_videos` espejo de
-- `vtli_posts`, NO extensión de la tabla existente. Razones:
--   · Categorías propias (veo, zakhaar) distintas a las imágenes.
--   · Polling independiente — el frontend trackea por separado.
--   · Memoria pulso_nucleo distinta (Reels vs feed conceptualmente
--     pueden ser temas independientes).
--   · Costo display separado en el dashboard del Atelier.
--   · Schema casi idéntico pero con video_r2_url + duration_seconds
--     + replicate_prediction_id (tracking de la prediction de Replicate
--     para diagnóstico si falla).

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE vtli_video_category AS ENUM ('veo', 'zakhaar');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE vtli_video_status AS ENUM (
        'draft',      -- recién generado, esperando review
        'approved',   -- Zak aprobó para publicar manual
        'rejected',   -- Zak descartó (o falló la generación)
        'rerolled',   -- Zak pidió reroll, este queda como padre del nuevo
        'published'   -- ya publicado en Reels (marca manual posterior)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vtli_videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category vtli_video_category NOT NULL,
    target text NOT NULL,
    aha_moment text NOT NULL,
    prompt_visual text NOT NULL,           -- prompt para Seedance (EN inglés)
    caption text NOT NULL,
    hashtags text[] NOT NULL DEFAULT '{}',
    pulso_nucleo text,                     -- memoria anti-repetición
    video_r2_url text,                     -- url pública R2 cuando completa
    duration_seconds smallint DEFAULT 5,   -- siempre 5s por ahora
    replicate_prediction_id text,          -- tracking de la prediction
    status vtli_video_status NOT NULL DEFAULT 'draft',
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    generated_by_clerk_id text NOT NULL,
    reroll_count int NOT NULL DEFAULT 0,
    parent_video_id uuid REFERENCES public.vtli_videos(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    reviewed_by_clerk_id text
);

COMMENT ON TABLE public.vtli_videos IS
    'Atelier de Marketing · Video — Reels generados con Gemini 3.5 (copy + prompt) + Replicate Seedance 2.0 (video 5s 9:16 720p). Lockdown via RLS sin policies, acceso solo por RPCs SECURITY DEFINER (frontend) o service_role (edge function generate-vtli-video).';

COMMENT ON COLUMN public.vtli_videos.parent_video_id IS
    'Si este video nació de un reroll, apunta al video original. Padre típicamente queda con status=''rerolled''.';

COMMENT ON COLUMN public.vtli_videos.video_r2_url IS
    'URL pública R2 con el mp4 9:16 generado por Seedance 2.0. Path: Veo tu Luz Interna/Videos/Atelier/{YYYY-MM-DD}/{uuid}.mp4';

COMMENT ON COLUMN public.vtli_videos.replicate_prediction_id IS
    'ID de la predicción de Replicate. Si la edge function falla a mitad de polling, queda persistido para diagnóstico manual desde replicate.com/p/<id>.';

-- Índices para queries comunes del panel
CREATE INDEX IF NOT EXISTS idx_vtli_videos_category_status_generated
    ON public.vtli_videos(category, status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_videos_status_generated
    ON public.vtli_videos(status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_videos_parent
    ON public.vtli_videos(parent_video_id)
    WHERE parent_video_id IS NOT NULL;

-- ============================================================
-- 3. RLS habilitado SIN POLICIES (lockdown total)
-- Solo edge function (service_role) o RPCs SECURITY DEFINER pueden tocarla.
-- ============================================================

ALTER TABLE public.vtli_videos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RPC: get_recent_vtli_videos
-- Devuelve los N videos más recientes, filtrables por categoría y status.
-- Admin-only via profiles.is_admin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_vtli_videos(
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
            pulso_nucleo,
            video_r2_url,
            duration_seconds,
            replicate_prediction_id,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_video_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_videos
        WHERE (p_category IS NULL OR category::text = p_category)
          AND (p_status IS NULL OR status::text = p_status)
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object(
        'videos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_videos(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC: get_vtli_videos_by_ids
-- Polling del frontend: pide los videos por IDs para detectar cuando
-- video_r2_url se popula tras la generación en background.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vtli_videos_by_ids(
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(sub))
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
            video_r2_url,
            duration_seconds,
            replicate_prediction_id,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_video_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_videos
        WHERE id = ANY(p_ids)
    ) sub;

    RETURN json_build_object(
        'videos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_videos_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- ============================================================
-- 6. RPC: update_vtli_video_status
-- Aprobar / rechazar / marcar como rerolled o published.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_vtli_video_status(
    p_admin_clerk_id text,
    p_video_id uuid,
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
    v_updated_status vtli_video_status;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('approved', 'rejected', 'rerolled', 'published') THEN
        RETURN json_build_object('error', 'invalid_status');
    END IF;

    UPDATE public.vtli_videos
    SET status = p_new_status::vtli_video_status,
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_video_id
    RETURNING id, status
    INTO v_updated_id, v_updated_status;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'video_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'video_id', v_updated_id,
        'status', v_updated_status::text
    );
END $$;

GRANT EXECUTE ON FUNCTION public.update_vtli_video_status(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 7. RPC: get_atelier_video_dashboard
-- Métricas del panel: counts del mes actual + total histórico.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_atelier_video_dashboard(
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_month_start := date_trunc('month', NOW());

    RETURN json_build_object(
        'is_admin', true,
        'month_generated_veo_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE category = 'veo' AND generated_at >= v_month_start
        ),
        'month_generated_zakhaar_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE category = 'zakhaar' AND generated_at >= v_month_start
        ),
        'month_approved_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_published_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime_video', (
            SELECT COUNT(*) FROM public.vtli_videos
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_atelier_video_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 8. RPC: increment_vtli_video_reroll_count
-- Util para la edge function: cuando crea un video hijo via reroll,
-- incrementa el contador del padre antes de marcarlo 'rerolled'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_vtli_video_reroll_count(
    p_video_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count int;
BEGIN
    UPDATE public.vtli_videos
    SET reroll_count = reroll_count + 1
    WHERE id = p_video_id
    RETURNING reroll_count INTO v_new_count;

    RETURN COALESCE(v_new_count, 0);
END $$;

GRANT EXECUTE ON FUNCTION public.increment_vtli_video_reroll_count(uuid)
    TO service_role;

-- ============================================================
-- 9. RPC: get_recent_pulsos_nucleo_video
-- Memoria anti-repetición. Devuelve los últimos N pulso_nucleo de
-- videos aprobados/publicados de la categoría, para inyectar en el
-- system prompt del Gemini Text y evitar conceptos repetidos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_pulsos_nucleo_video(
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
    SELECT json_agg(pulso_nucleo ORDER BY generated_at DESC)
    INTO v_result
    FROM (
        SELECT pulso_nucleo, generated_at
        FROM public.vtli_videos
        WHERE category::text = p_category
          AND status::text IN ('approved', 'published')
          AND pulso_nucleo IS NOT NULL
          AND length(trim(pulso_nucleo)) > 0
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 30), 1)
    ) sub;

    RETURN json_build_object(
        'pulsos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_pulsos_nucleo_video(text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 10. RPC: delete_vtli_video
-- Borra un video de DB (NO toca R2 — el mp4 huérfano queda en el
-- bucket hasta que se aplique limpieza manual). Admin-only.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_vtli_video(
    p_admin_clerk_id text,
    p_video_id uuid
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    DELETE FROM public.vtli_videos
    WHERE id = p_video_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RETURN json_build_object('error', 'video_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'video_id', p_video_id
    );
END $$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_video(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260526e_vtli_videos.sql
--
-- Después de aplicar, validar con tres queries rápidas:
--   SELECT * FROM public.vtli_videos LIMIT 0;
--   SELECT get_atelier_video_dashboard(clerk_user_id)
--     FROM profiles WHERE is_admin = true LIMIT 1;
--   SELECT get_recent_pulsos_nucleo_video('veo', 10);
-- ============================================================
