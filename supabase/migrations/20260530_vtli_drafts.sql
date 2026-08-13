-- 20260530_vtli_drafts.sql
-- Atelier de Marketing · Estudio Manual — Storyboards de keyframes.
-- Un "draft" es un STORYBOARD: un concepto narrativo de 40-60s dividido
-- en N keyframes (beats) consistentes (misma cara) generados con Nano
-- Banana (gemini-3.1-flash-image-preview, keyframe 0 ancla + 1..N con
-- imagen de referencia). Cada keyframe se anima por separado en Grok
-- (manual, $0 con SuperGrok) o por API (LTX-2 Fast). Zak une los clips
-- en su editor. Aplicar pegando este archivo completo en Supabase
-- Dashboard → SQL Editor → New Query → Run.
--
-- Decisión: DOS tablas. vtli_drafts (el concepto/storyboard) +
-- vtli_draft_keyframes (los cuadros 1:N). Espejo conceptual de
-- vtli_videos pero con relación padre→hijos. Categoría reusa
-- vtli_video_category ('veo','zakhaar') porque el storyboard narrativo
-- con personaje vive en los mismos dos canales que el video.

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE vtli_draft_status AS ENUM (
        'generating',        -- keyframes generándose en background
        'storyboard_ready',  -- todos los keyframes con imagen lista
        'approved',          -- Zak aprobó el storyboard
        'rejected',          -- Zak descartó (o falló la generación)
        'rerolled',          -- Zak pidió reroll, este queda como padre
        'published',         -- Reel final ya publicado (marca manual)
        'deleted'            -- soft delete (preserva pulso anti-repetición)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE vtli_kf_anim_status AS ENUM (
        'idle',       -- keyframe con imagen, sin animar todavía
        'animating',  -- animación en curso (API LTX-2) o esperando subida manual
        'animated',   -- clip de video listo (manual o API)
        'failed'      -- la animación por API falló
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vtli_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category vtli_video_category NOT NULL,          -- 'veo' | 'zakhaar'
    target text NOT NULL,
    concept_title text NOT NULL,                    -- título corto del storyboard
    narrative text NOT NULL,                        -- arco narrativo completo (referencia Zak)
    caption text NOT NULL,                          -- caption Instagram del Reel completo
    hashtags text[] NOT NULL DEFAULT '{}',
    pulso_nucleo text,                              -- memoria anti-repetición
    target_duration_sec smallint NOT NULL DEFAULT 50,
    keyframes_count smallint NOT NULL DEFAULT 5,
    status vtli_draft_status NOT NULL DEFAULT 'generating',
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    generated_by_clerk_id text NOT NULL,
    reroll_count int NOT NULL DEFAULT 0,
    parent_draft_id uuid REFERENCES public.vtli_drafts(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    reviewed_by_clerk_id text
);

COMMENT ON TABLE public.vtli_drafts IS
    'Atelier · Estudio Manual — storyboards de keyframes para Reels VTLI. Un draft = concepto narrativo de 40-60s dividido en N keyframes consistentes. Lockdown via RLS sin policies; acceso por RPCs SECURITY DEFINER (frontend) o service_role (edge function generate-vtli-storyboard).';

CREATE TABLE IF NOT EXISTS public.vtli_draft_keyframes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id uuid NOT NULL REFERENCES public.vtli_drafts(id) ON DELETE CASCADE,
    beat_index smallint NOT NULL,                   -- orden 0..N-1
    beat_label text NOT NULL,                       -- "Gancho" · "Desarrollo" · "Revelación" · "Cierre"
    copy_line text,                                 -- frase/voz/overlay de ese beat
    prompt_image text NOT NULL,                     -- prompt Nano Banana que generó el keyframe
    prompt_animation text NOT NULL,                 -- prompt de SOLO MOVIMIENTO para Grok
    image_r2_url text,                              -- keyframe Nano Banana (null hasta generar)
    video_r2_url text,                              -- clip animado (null hasta animar)
    video_source text,                              -- 'manual_grok' | 'api_ltx' | null
    anim_status vtli_kf_anim_status NOT NULL DEFAULT 'idle',
    anim_request_id text,                           -- tracking async (fal.ai request_id de LTX-2)
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.vtli_draft_keyframes IS
    'Cuadros de un storyboard vtli_drafts. image_r2_url = keyframe Nano Banana; video_r2_url = clip animado (Grok manual o LTX-2 API). Path R2 imágenes: Veo tu Luz Interna/Imagenes/Atelier/{YYYY-MM-DD}/{uuid}.{ext}; videos: Veo tu Luz Interna/Videos/Atelier/{YYYY-MM-DD}/{uuid}.mp4';

COMMENT ON COLUMN public.vtli_draft_keyframes.prompt_animation IS
    'Prompt para Grok Imagine: describe SOLO el movimiento (micro-movimiento sutil), NUNCA re-describe la imagen. Grok ignora prompts negativos.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_vtli_drafts_category_status_generated
    ON public.vtli_drafts(category, status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_drafts_status_generated
    ON public.vtli_drafts(status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_drafts_parent
    ON public.vtli_drafts(parent_draft_id)
    WHERE parent_draft_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vtli_draft_keyframes_draft
    ON public.vtli_draft_keyframes(draft_id, beat_index);

-- ============================================================
-- 3. RLS habilitado SIN POLICIES (lockdown total)
-- ============================================================

ALTER TABLE public.vtli_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vtli_draft_keyframes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RPC: get_recent_vtli_drafts
-- Devuelve los N storyboards más recientes (con sus keyframes anidados),
-- filtrables por categoría y status. Excluye 'deleted'. Admin-only.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_vtli_drafts(
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(sub) ORDER BY sub.generated_at DESC)
    INTO v_result
    FROM (
        SELECT
            d.id,
            d.category::text AS category,
            d.target,
            d.concept_title,
            d.narrative,
            d.caption,
            d.hashtags,
            d.pulso_nucleo,
            d.target_duration_sec,
            d.keyframes_count,
            d.status::text AS status,
            d.generated_at,
            d.generated_by_clerk_id,
            d.reroll_count,
            d.parent_draft_id,
            d.reviewed_at,
            d.reviewed_by_clerk_id,
            COALESCE((
                SELECT json_agg(row_to_json(kf) ORDER BY kf.beat_index)
                FROM (
                    SELECT
                        k.id,
                        k.beat_index,
                        k.beat_label,
                        k.copy_line,
                        k.prompt_image,
                        k.prompt_animation,
                        k.image_r2_url,
                        k.video_r2_url,
                        k.video_source,
                        k.anim_status::text AS anim_status,
                        k.anim_request_id
                    FROM public.vtli_draft_keyframes k
                    WHERE k.draft_id = d.id
                ) kf
            ), '[]'::json) AS keyframes
        FROM public.vtli_drafts d
        WHERE (p_category IS NULL OR d.category::text = p_category)
          AND (p_status IS NULL OR d.status::text = p_status)
          AND d.status::text <> 'deleted'
        ORDER BY d.generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object(
        'drafts', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_drafts(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC: get_vtli_drafts_by_ids
-- Polling del frontend: storyboards por IDs (con keyframes anidados)
-- para detectar cuando image_r2_url / video_r2_url se populan.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vtli_drafts_by_ids(
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
            d.id,
            d.category::text AS category,
            d.target,
            d.concept_title,
            d.narrative,
            d.caption,
            d.hashtags,
            d.pulso_nucleo,
            d.target_duration_sec,
            d.keyframes_count,
            d.status::text AS status,
            d.generated_at,
            d.generated_by_clerk_id,
            d.reroll_count,
            d.parent_draft_id,
            d.reviewed_at,
            d.reviewed_by_clerk_id,
            COALESCE((
                SELECT json_agg(row_to_json(kf) ORDER BY kf.beat_index)
                FROM (
                    SELECT
                        k.id,
                        k.beat_index,
                        k.beat_label,
                        k.copy_line,
                        k.prompt_image,
                        k.prompt_animation,
                        k.image_r2_url,
                        k.video_r2_url,
                        k.video_source,
                        k.anim_status::text AS anim_status,
                        k.anim_request_id
                    FROM public.vtli_draft_keyframes k
                    WHERE k.draft_id = d.id
                ) kf
            ), '[]'::json) AS keyframes
        FROM public.vtli_drafts d
        WHERE d.id = ANY(p_ids)
    ) sub;

    RETURN json_build_object(
        'drafts', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_drafts_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- ============================================================
-- 6. RPC: update_vtli_draft_status
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_vtli_draft_status(
    p_admin_clerk_id text,
    p_draft_id uuid,
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
    v_updated_status vtli_draft_status;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('storyboard_ready', 'approved', 'rejected', 'rerolled', 'published') THEN
        RETURN json_build_object('error', 'invalid_status');
    END IF;

    UPDATE public.vtli_drafts
    SET status = p_new_status::vtli_draft_status,
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_draft_id
    RETURNING id, status
    INTO v_updated_id, v_updated_status;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'draft_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'draft_id', v_updated_id,
        'status', v_updated_status::text
    );
END $$;

GRANT EXECUTE ON FUNCTION public.update_vtli_draft_status(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 7. RPC: set_vtli_keyframe_video
-- El frontend lo llama tras subir el .mp4 de Grok (manual) o lo usa
-- la edge function de animación por API. Setea el video del keyframe.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_vtli_keyframe_video(
    p_admin_clerk_id text,
    p_keyframe_id uuid,
    p_video_r2_url text,
    p_source text DEFAULT 'manual_grok'
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_source NOT IN ('manual_grok', 'api_ltx') THEN
        RETURN json_build_object('error', 'invalid_source');
    END IF;

    UPDATE public.vtli_draft_keyframes
    SET video_r2_url = p_video_r2_url,
        video_source = p_source,
        anim_status = 'animated',
        anim_request_id = NULL,
        updated_at = NOW()
    WHERE id = p_keyframe_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'keyframe_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'keyframe_id', v_updated_id,
        'video_r2_url', p_video_r2_url,
        'source', p_source
    );
END $$;

GRANT EXECUTE ON FUNCTION public.set_vtli_keyframe_video(text, uuid, text, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 8. RPC: get_atelier_drafts_dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_atelier_drafts_dashboard(
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
        'month_generated_veo_draft', (
            SELECT COUNT(*) FROM public.vtli_drafts
            WHERE category = 'veo' AND status <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_zakhaar_draft', (
            SELECT COUNT(*) FROM public.vtli_drafts
            WHERE category = 'zakhaar' AND status <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_keyframes_animated', (
            SELECT COUNT(*) FROM public.vtli_draft_keyframes
            WHERE anim_status = 'animated' AND updated_at >= v_month_start
        ),
        'total_lifetime_draft', (
            SELECT COUNT(*) FROM public.vtli_drafts
            WHERE status <> 'deleted'
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_atelier_drafts_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 9. RPC: increment_vtli_draft_reroll_count
-- Util para la edge function al crear un draft hijo via reroll.
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_vtli_draft_reroll_count(
    p_draft_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count int;
BEGIN
    UPDATE public.vtli_drafts
    SET reroll_count = reroll_count + 1
    WHERE id = p_draft_id
    RETURNING reroll_count INTO v_new_count;

    RETURN COALESCE(v_new_count, 0);
END $$;

GRANT EXECUTE ON FUNCTION public.increment_vtli_draft_reroll_count(uuid)
    TO service_role;

-- ============================================================
-- 10. RPC: delete_vtli_draft (soft delete)
-- Marca el storyboard como 'deleted' (preserva pulso anti-repetición).
-- Los keyframes quedan en DB; al filtrar 'deleted' no se muestran.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_vtli_draft(
    p_admin_clerk_id text,
    p_draft_id uuid
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.vtli_drafts
    SET status = 'deleted',
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_draft_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'draft_not_found');
    END IF;

    RETURN json_build_object('success', true, 'draft_id', v_updated_id);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_draft(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- 11. RPC: get_recent_pulsos_nucleo_draft
-- Memoria anti-repetición. Últimos N pulso_nucleo de storyboards NO
-- rejected/deleted de la categoría (cubre el flow de Zak: descarga +
-- publica manual, nunca aprueba en panel).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_pulsos_nucleo_draft(
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
        FROM public.vtli_drafts
        WHERE category::text = p_category
          AND status::text NOT IN ('rejected', 'deleted')
          AND pulso_nucleo IS NOT NULL
          AND length(trim(pulso_nucleo)) > 0
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 30), 1)
    ) sub;

    RETURN json_build_object(
        'pulsos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_pulsos_nucleo_draft(text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260530_vtli_drafts.sql
--
-- Validar tras aplicar:
--   SELECT * FROM public.vtli_drafts LIMIT 0;
--   SELECT * FROM public.vtli_draft_keyframes LIMIT 0;
--   SELECT get_atelier_drafts_dashboard(clerk_user_id)
--     FROM profiles WHERE is_admin = true LIMIT 1;
--   SELECT get_recent_pulsos_nucleo_draft('zakhaar', 10);
-- ============================================================
