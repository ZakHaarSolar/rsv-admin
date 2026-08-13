-- 20260503b_admin_navegante_progress.sql
-- RPC admin para inspeccionar el progreso del Navegante de un Tripulante
-- target desde el Motor de Intervención. Patrón canónico admin:
-- p_admin_clerk_id se valida contra profiles.is_admin antes de devolver.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.admin_get_user_navegante_progress(
    p_admin_clerk_id text,
    p_target_clerk_id text
)
RETURNS TABLE (
    tutorial_completed boolean,
    membranas_completed integer,
    last_completed_id integer,
    last_updated timestamptz,
    has_chord boolean,
    levels jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    -- Gate: solo admins.
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF v_is_admin IS NOT TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH rows AS (
        SELECT *
        FROM public.navegante_progress
        WHERE clerk_user_id = p_target_clerk_id
    )
    SELECT
        COALESCE(BOOL_OR(rows.completed) FILTER (WHERE rows.level_id = 0), FALSE)
            AS tutorial_completed,
        COALESCE(COUNT(*) FILTER (
            WHERE rows.level_id <> 0 AND rows.completed = TRUE
        ), 0)::integer AS membranas_completed,
        (
            SELECT level_id FROM rows
            WHERE completed = TRUE AND level_id <> 0
            ORDER BY updated_at DESC
            LIMIT 1
        )::integer AS last_completed_id,
        MAX(rows.updated_at) AS last_updated,
        COALESCE(BOOL_OR(rows.chord), FALSE) AS has_chord,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', rows.level_id,
                    'completed', rows.completed,
                    'chord', rows.chord,
                    'updated_at', rows.updated_at
                )
                ORDER BY rows.level_id
            ),
            '[]'::jsonb
        ) AS levels
    FROM rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_navegante_progress(text, text)
    TO anon, authenticated;
