-- 20260709d_suno_album_output.sql
-- Frecuencias Sonoras — SALIDA EN ÁLBUM. Ahora el panel puede crear 1 pieza O un
-- ÁLBUM de N piezas: cada track es un ángulo distinto del MISMO pulso core (mismo
-- estilo, distinta cara). Las N piezas se guardan como filas de suno_creations
-- agrupadas por set_id (misma "sesión de álbum"). Reusa toda la maquinaria de la
-- galería + regenerar-letra por track.
--
-- Depende de 20260709c_suno_frecuencias. Idempotente. Pegar en Supabase Dashboard
-- → SQL Editor → New Query → Run.

-- ============================================================
-- 1. Columnas de agrupamiento de álbum en suno_creations
-- ============================================================
ALTER TABLE public.suno_creations
    ADD COLUMN IF NOT EXISTS set_id       uuid,          -- agrupa las piezas de un mismo álbum
    ADD COLUMN IF NOT EXISTS set_title    text NOT NULL DEFAULT '', -- título del álbum
    ADD COLUMN IF NOT EXISTS track_no     int,           -- número de pieza dentro del álbum
    ADD COLUMN IF NOT EXISTS total_tracks int,           -- total de piezas del álbum
    ADD COLUMN IF NOT EXISTS angle        text NOT NULL DEFAULT ''; -- el ángulo de esta pieza sobre el pulso core

COMMENT ON COLUMN public.suno_creations.set_id IS
    'Si la creación es parte de un álbum, el uuid del álbum (agrupa sus N piezas). NULL = pieza suelta.';

CREATE INDEX IF NOT EXISTS idx_suno_creations_set
    ON public.suno_creations(set_id, track_no)
    WHERE set_id IS NOT NULL;

-- ============================================================
-- 2. get_suno_creations_admin — ahora devuelve los campos de álbum
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
            cr.set_id, cr.set_title, cr.track_no, cr.total_tracks, cr.angle
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
-- 3. delete_suno_creation_admin — variante para borrar un álbum entero por set_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_suno_set_admin(
    p_admin_clerk_id text,
    p_set_id uuid
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

    UPDATE public.suno_creations SET status = 'deleted' WHERE set_id = p_set_id;
    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_suno_set_admin(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- FIN. Recuerda:
--   1. Sumar delete_suno_set_admin al whitelist de admin-action (v1.32).
--   2. Redesplegar el edge generate-suno-prompt (v1.1: modo álbum + imagen real).
-- ============================================================
