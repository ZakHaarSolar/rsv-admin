-- 20260530c_vtli_drafts_audio.sql
-- Agrega narration_audio_url (mp3 de la voz generada con ElevenLabs) a
-- vtli_drafts y lo expone en los dos RPCs de lectura. Aplicar pegando este
-- archivo completo en Supabase Dashboard → SQL Editor → Run.
-- (Asume que 20260530b_vtli_drafts_narration ya está aplicada.)

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS narration_audio_url text;

COMMENT ON COLUMN public.vtli_drafts.narration_audio_url IS
    'URL pública R2 del mp3 de voz en off generado con ElevenLabs (edge function generar-narracion-voz). Path: Veo tu Luz Interna/Audio/Atelier/{YYYY-MM-DD}/{uuid}.mp3';

-- ============================================================
-- get_recent_vtli_drafts — + narration + narration_audio_url
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
            d.narration,
            d.narration_audio_url,
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
-- get_vtli_drafts_by_ids — + narration + narration_audio_url
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
            d.narration,
            d.narration_audio_url,
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
-- Fin de migración 20260530c_vtli_drafts_audio.sql
-- ============================================================
