-- 20260710_suno_produced_cover.sql
-- Frecuencias Sonoras — cierra el ciclo creación → producción + portada de álbum.
--
--   1. Columnas nuevas en suno_creations:
--      · produced_at / produced_url — "Producida en Suno" por pieza (con link al track).
--      · set_cover_prompt — prompt de PORTADA del álbum para Nano Banana
--        (denormalizado por set, igual que set_title: vive en cada fila del set).
--   2. RPC set_suno_produced_admin — marca/desmarca una pieza como producida.
--   3. get_suno_creations_admin redefinida — devuelve los 3 campos nuevos.
--
-- Pareja de: edge generate-suno-prompt v1.5 (cover_prompt en album/expand_album +
-- modo album_cover + afinador de letra) + admin-action v1.34 + panel v1.5.
--
-- Idempotente. Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- 1. COLUMNAS
-- ============================================================
ALTER TABLE public.suno_creations
    ADD COLUMN IF NOT EXISTS produced_at      timestamptz,
    ADD COLUMN IF NOT EXISTS produced_url     text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS set_cover_prompt text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.suno_creations.produced_at IS
    'Cuándo se marcó la pieza como PRODUCIDA en Suno (NULL = pendiente).';
COMMENT ON COLUMN public.suno_creations.produced_url IS
    'Link al track producido en Suno (opcional).';
COMMENT ON COLUMN public.suno_creations.set_cover_prompt IS
    'Prompt de PORTADA del álbum para Nano Banana (denormalizado: igual en cada fila del set).';

-- ============================================================
-- 2. set_suno_produced_admin — marcar/desmarcar producida (+ link)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_suno_produced_admin(
    p_admin_clerk_id text,
    p_id uuid,
    p_produced boolean,
    p_url text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.suno_creations
    SET produced_at  = CASE WHEN p_produced THEN NOW() ELSE NULL END,
        produced_url = CASE WHEN p_produced THEN COALESCE(p_url, '') ELSE '' END
    WHERE id = p_id;

    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.set_suno_produced_admin(text, uuid, boolean, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 3. get_suno_creations_admin — ahora devuelve produced_* + set_cover_prompt
--    (CREATE OR REPLACE; se re-afirma el GRANT al final)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_suno_creations_admin(
    p_admin_clerk_id text,
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
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(c) ORDER BY c.generated_at DESC)
    INTO v_result
    FROM (
        SELECT
            cr.id, cr.title, cr.direction_name, cr.direction,
            cr.seed_text, cr.reference_text, cr.project, cr.norte_key,
            cr.norte_album_ids, cr.norte_track_ids, cr.norte_creation_ids,
            cr.inspiration, cr.norte_mode, cr.knobs, cr.instrumental,
            cr.lyrics_lang, cr.style_prompt, cr.excludes, cr.weirdness,
            cr.style_influence, cr.lyrics, cr.config_notes, cr.generated_at,
            cr.set_id, cr.set_title, cr.track_no, cr.total_tracks, cr.angle,
            cr.produced_at, cr.produced_url, cr.set_cover_prompt
        FROM public.suno_creations cr
        WHERE cr.status <> 'deleted'
        ORDER BY cr.generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 300), 1)
    ) c;

    RETURN json_build_object('creations', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_suno_creations_admin(text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- FIN. Recuerda:
--   1. admin-action v1.34 suma set_suno_produced_admin al whitelist.
--   2. Redesplegar generate-suno-prompt (v1.5) + admin-action (v1.34).
-- ============================================================
