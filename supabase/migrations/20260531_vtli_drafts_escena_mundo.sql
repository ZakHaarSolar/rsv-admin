-- 20260531_vtli_drafts_escena_mundo.sql
-- VARIEDAD VISUAL: agrega escena_mundo (mundo + paleta dominante del
-- storyboard) a vtli_drafts + RPC de anti-repetición get_recent_escenas_draft.
-- Resuelve que todos los Reels caigan en el mismo "domo de cristal pastel":
-- el modelo emite el mundo+paleta elegidos, se guarda, y los próximos
-- storyboards evitan repetir los mundos/paletas recientes.
-- Aplicar pegando este archivo COMPLETO en Supabase Dashboard → SQL Editor → Run.
-- (Asume 20260530 / b / c ya aplicadas.)

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS escena_mundo text;

COMMENT ON COLUMN public.vtli_drafts.escena_mundo IS
    'Tag compacto "mundo · paleta dominante" del storyboard (ej. "bosque bioluminiscente · esmeralda y turquesa"). Lo emite el modelo (generate-vtli-storyboard) y se usa para anti-repetir mundos+paletas en storyboards recientes (get_recent_escenas_draft).';

-- ============================================================
-- RPC: get_recent_escenas_draft
-- Memoria anti-repetición de MUNDO + PALETA. Últimos N escena_mundo de
-- storyboards NO rejected/deleted de la categoría (mismo patrón que
-- get_recent_pulsos_nucleo_draft).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_escenas_draft(
    p_category text,
    p_limit int DEFAULT 8
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_agg(escena_mundo ORDER BY generated_at DESC)
    INTO v_result
    FROM (
        SELECT escena_mundo, generated_at
        FROM public.vtli_drafts
        WHERE category::text = p_category
          AND status::text NOT IN ('rejected', 'deleted')
          AND escena_mundo IS NOT NULL
          AND length(trim(escena_mundo)) > 0
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 30), 1)
    ) sub;

    RETURN json_build_object(
        'escenas', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_escenas_draft(text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260531_vtli_drafts_escena_mundo.sql
--
-- Validar tras aplicar:
--   SELECT escena_mundo FROM public.vtli_drafts LIMIT 0;
--   SELECT get_recent_escenas_draft('zakhaar', 8);
-- ============================================================
