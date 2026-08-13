-- 20260602c_vtli_drafts_takes_published.sql
-- Estudio Manual — DOS afinaciones de los storyboards:
--   (1) TOMAS DE VOZ acumulables: narration_takes_json guarda cada voz
--       generada como una toma {voice_id, voice_name, audio_url, created_at}
--       en vez de pisar la anterior. Así Zak prueba varias voces y las
--       compara escuchándolas todas (toma 1, toma 2, otra vez la 1…).
--   (2) PUBLICADO: is_published — marca manual para diferenciar los
--       storyboards que ya se publicaron como Reel (toggle en cada tarjeta).
-- Aplicar pegando este archivo COMPLETO en Supabase Dashboard → SQL Editor → Run.
-- (Asume 20260530 / b / c / 20260531 / 20260601 / 20260602 ya aplicadas.)

-- ============================================================
-- 1. COLUMNAS NUEVAS
-- ============================================================

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS narration_takes_json jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vtli_drafts.narration_takes_json IS
    'Tomas de voz en off generadas con ElevenLabs, acumuladas: [{voice_id, voice_name, audio_url, created_at}]. La edge function generar-narracion-voz appendea cada toma (no pisa). narration_audio_url apunta a la última.';

COMMENT ON COLUMN public.vtli_drafts.is_published IS
    'Marca manual: el Reel de este storyboard ya se publicó. Ortogonal al status (ciclo de generación). Lo togglea Zak desde el panel vía set_vtli_draft_published.';

-- ============================================================
-- 2. get_recent_vtli_drafts — + narration_takes_json + is_published
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
            d.narration_takes_json,
            d.is_published,
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
-- 3. get_vtli_drafts_by_ids — + narration_takes_json + is_published
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
            d.narration_takes_json,
            d.is_published,
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
-- 4. set_vtli_draft_published — toggle de la marca Publicado
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_vtli_draft_published(
    p_admin_clerk_id text,
    p_draft_id uuid,
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.vtli_drafts
    SET is_published = COALESCE(p_published, false)
    WHERE id = p_draft_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'draft_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'draft_id', v_updated_id,
        'is_published', COALESCE(p_published, false)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.set_vtli_draft_published(text, uuid, boolean)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. set_vtli_draft_narration_takes — reemplaza la lista de tomas
-- (borrar una toma desde el panel). Re-sincroniza narration_audio_url a
-- la ÚLTIMA toma que quede (o NULL si no queda ninguna).
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_vtli_draft_narration_takes(
    p_admin_clerk_id text,
    p_draft_id uuid,
    p_takes jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_id uuid;
    v_takes jsonb;
    v_last_url text;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Normaliza: si no es un array JSON, cae a [].
    v_takes := CASE
        WHEN jsonb_typeof(p_takes) = 'array' THEN p_takes
        ELSE '[]'::jsonb
    END;

    -- URL de la última toma que queda (puntero "actual").
    v_last_url := NULLIF(
        v_takes -> (jsonb_array_length(v_takes) - 1) ->> 'audio_url',
        ''
    );

    UPDATE public.vtli_drafts
    SET narration_takes_json = v_takes,
        narration_audio_url = v_last_url
    WHERE id = p_draft_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'draft_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'draft_id', v_updated_id,
        'narration_audio_url', v_last_url,
        'takes', v_takes
    );
END $$;

GRANT EXECUTE ON FUNCTION public.set_vtli_draft_narration_takes(text, uuid, jsonb)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260602c_vtli_drafts_takes_published.sql
--
-- Validar tras aplicar:
--   SELECT narration_takes_json, is_published FROM public.vtli_drafts LIMIT 0;
--   SELECT set_vtli_draft_published('TU_CLERK_ID', 'UUID_DRAFT', true);
-- ============================================================
