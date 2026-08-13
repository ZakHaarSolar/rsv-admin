-- 20260710_vtli_episodios.sql
-- Atelier · Estudio Manual (Zak'Haar Video) — MODO EPISODIO (emisiones de
-- profundidad extendida): mini-episodios cinematográficos de 90s / 2min / 3min
-- estructurados en ESCENAS (2-3 cuadros por escena: continuidad interna + cortes
-- deliberados entre escenas) + SCORE musical del episodio para Suno.
-- (a) vtli_drafts: + format ('reel' | 'episodio') + score_json (la música sugerida
--     para Suno: estilo, excludes, weirdness/style influence, notas de arco).
-- (b) vtli_draft_keyframes: + scene_index + scene_label (a qué escena pertenece
--     cada cuadro; los reels viejos quedan NULL).
-- (c) Re-crea las 2 RPC de lectura para devolver los campos nuevos (conserva
--     TODO lo de 20260625h: codice_id + codice_title incluidos).
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'reel';
ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS score_json jsonb;

COMMENT ON COLUMN public.vtli_drafts.format IS
    'reel = storyboard corto clásico · episodio = mini-episodio cinematográfico por escenas (90s/2min/3min) con score de Suno.';
COMMENT ON COLUMN public.vtli_drafts.score_json IS
    'Solo episodios: música del episodio para Suno {title, style, exclude_styles, weirdness, style_influence, notes}.';

ALTER TABLE public.vtli_draft_keyframes
    ADD COLUMN IF NOT EXISTS scene_index int;
ALTER TABLE public.vtli_draft_keyframes
    ADD COLUMN IF NOT EXISTS scene_label text;

COMMENT ON COLUMN public.vtli_draft_keyframes.scene_index IS
    'Solo episodios: número de escena (1..M) a la que pertenece el cuadro. NULL = reel clásico.';

-- ============================================================
-- 1. get_recent_vtli_drafts — + format + score_json + scene_* en keyframes
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
            d.codice_id,
            (SELECT cl.title FROM public.codices_luz cl WHERE cl.id = d.codice_id) AS codice_title,
            d.format,
            d.score_json,
            COALESCE((
                SELECT json_agg(row_to_json(kf) ORDER BY kf.beat_index)
                FROM (
                    SELECT
                        k.id, k.beat_index, k.beat_label, k.copy_line,
                        k.prompt_image, k.prompt_animation, k.image_r2_url,
                        k.video_r2_url, k.video_source,
                        k.anim_status::text AS anim_status, k.anim_request_id,
                        k.scene_index, k.scene_label
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
-- 2. get_vtli_drafts_by_ids — + format + score_json + scene_* en keyframes
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
            d.codice_id,
            (SELECT cl.title FROM public.codices_luz cl WHERE cl.id = d.codice_id) AS codice_title,
            d.format,
            d.score_json,
            COALESCE((
                SELECT json_agg(row_to_json(kf) ORDER BY kf.beat_index)
                FROM (
                    SELECT
                        k.id, k.beat_index, k.beat_label, k.copy_line,
                        k.prompt_image, k.prompt_animation, k.image_r2_url,
                        k.video_r2_url, k.video_source,
                        k.anim_status::text AS anim_status, k.anim_request_id,
                        k.scene_index, k.scene_label
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
