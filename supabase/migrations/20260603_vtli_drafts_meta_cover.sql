-- 20260603_vtli_drafts_meta_cover.sql
-- Estudio Manual — DATOS DE LA GENERACIÓN + PORTADA VISUAL.
--   (1) colectivo_name / ambiente_name: guarda QUÉ colectivo y ambiente se
--       usaron en cada storyboard (NULL = automático). Se ven en la tarjeta.
--   (2) cover_image_url: una imagen de portada por storyboard (Zak sube su
--       keyframe #1) para ubicar visualmente cada iteración. La imagen vive en
--       Cloudflare R2; la DB solo guarda la URL.
-- Aplicar pegando este archivo COMPLETO en Supabase Dashboard → SQL Editor → Run.
-- (Asume 20260530 / b / c / 20260531 / 20260601 / 20260602 / c / d aplicadas.)

-- ============================================================
-- 1. COLUMNAS NUEVAS
-- ============================================================

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS colectivo_name text,
    ADD COLUMN IF NOT EXISTS ambiente_name text,
    ADD COLUMN IF NOT EXISTS cover_image_url text;

COMMENT ON COLUMN public.vtli_drafts.colectivo_name IS
    'Nombre del colectivo usado al generar (NULL = automático/sintonizar nuevo). Solo informativo para la tarjeta.';
COMMENT ON COLUMN public.vtli_drafts.ambiente_name IS
    'Nombre del ambiente usado al generar (NULL = automático). Solo informativo para la tarjeta.';
COMMENT ON COLUMN public.vtli_drafts.cover_image_url IS
    'URL R2 de la imagen de portada del storyboard (Zak sube su keyframe #1). Path: Veo tu Luz Interna/Imagenes/Atelier/Covers/{uuid}.{ext}';

-- ============================================================
-- 2. get_recent_vtli_drafts — + colectivo_name + ambiente_name + cover_image_url
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
            d.id,
            d.category::text AS category,
            d.target,
            d.concept_title,
            d.narrative,
            d.narration,
            d.narration_audio_url,
            d.narration_takes_json,
            d.is_published,
            d.colectivo_name,
            d.ambiente_name,
            d.cover_image_url,
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
                        k.id, k.beat_index, k.beat_label, k.copy_line,
                        k.prompt_image, k.prompt_animation, k.image_r2_url,
                        k.video_r2_url, k.video_source,
                        k.anim_status::text AS anim_status, k.anim_request_id
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

    RETURN json_build_object('drafts', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_drafts(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 3. get_vtli_drafts_by_ids — + colectivo_name + ambiente_name + cover_image_url
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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
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
            d.narration,
            d.narration_audio_url,
            d.narration_takes_json,
            d.is_published,
            d.colectivo_name,
            d.ambiente_name,
            d.cover_image_url,
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
                        k.id, k.beat_index, k.beat_label, k.copy_line,
                        k.prompt_image, k.prompt_animation, k.image_r2_url,
                        k.video_r2_url, k.video_source,
                        k.anim_status::text AS anim_status, k.anim_request_id
                    FROM public.vtli_draft_keyframes k
                    WHERE k.draft_id = d.id
                ) kf
            ), '[]'::json) AS keyframes
        FROM public.vtli_drafts d
        WHERE d.id = ANY(p_ids)
    ) sub;

    RETURN json_build_object('drafts', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_drafts_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- ============================================================
-- 4. set_vtli_draft_cover — guarda/quita la URL de portada (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_vtli_draft_cover(
    p_admin_clerk_id text,
    p_draft_id uuid,
    p_cover_url text
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

    UPDATE public.vtli_drafts
    SET cover_image_url = NULLIF(trim(COALESCE(p_cover_url, '')), '')
    WHERE id = p_draft_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'draft_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'draft_id', v_updated_id,
        'cover_image_url', NULLIF(trim(COALESCE(p_cover_url, '')), '')
    );
END $$;

GRANT EXECUTE ON FUNCTION public.set_vtli_draft_cover(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260603_vtli_drafts_meta_cover.sql
--
-- Validar tras aplicar:
--   SELECT colectivo_name, ambiente_name, cover_image_url FROM public.vtli_drafts LIMIT 0;
-- ============================================================
