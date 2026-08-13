-- 20260526b_vtli_atelier_pulso_nucleo.sql
-- Memoria de corto plazo del Atelier: campo pulso_nucleo en cada post
-- (resumen de 1 oración del concepto central). Cuando un post se aprueba,
-- este pulso entra a la memoria anti-repetición que se inyecta en el
-- user prompt de Gemini 3.5 para la próxima generación de la misma
-- categoría, garantizando frescura conceptual.
--
-- Aplicar pegando este archivo completo en Supabase Dashboard →
-- SQL Editor → New Query → Run.

-- ============================================================
-- 1. ALTER TABLE — columna pulso_nucleo
-- ============================================================

ALTER TABLE public.vtli_posts
    ADD COLUMN IF NOT EXISTS pulso_nucleo text;

COMMENT ON COLUMN public.vtli_posts.pulso_nucleo IS
    'Resumen de 1 oración del concepto central del post (lo genera Gemini 3.5 al crear el post). Cuando un post se aprueba, este pulso entra a la memoria anti-repetición que se inyecta en futuras generaciones de la misma categoría.';

-- ============================================================
-- 2. RPC: get_recent_pulsos_nucleo
-- Devuelve array de pulsos de los últimos N posts APROBADOS de la
-- categoría. La edge function la llama con service_role antes de
-- generar nuevos posts, para inyectar los pulsos en el user prompt
-- y evitar repetición conceptual.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_pulsos_nucleo(
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
    -- Sin admin gate: la edge function la llama con service_role y el
    -- caller (handler principal) ya validó admin antes de llegar aquí.
    SELECT json_agg(pulso_nucleo ORDER BY reviewed_at DESC NULLS LAST)
    INTO v_result
    FROM (
        SELECT pulso_nucleo, reviewed_at
        FROM public.vtli_posts
        WHERE status = 'approved'
          AND category::text = p_category
          AND pulso_nucleo IS NOT NULL
          AND length(trim(pulso_nucleo)) > 0
        ORDER BY reviewed_at DESC NULLS LAST
        LIMIT GREATEST(LEAST(p_limit, 50), 1)
    ) sub;

    RETURN json_build_object(
        'pulsos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_pulsos_nucleo(text, int)
    TO service_role;

-- ============================================================
-- Notas:
-- · get_recent_vtli_posts ya devuelve pulso_nucleo automáticamente
--   (usa SELECT * sub) — no requiere update.
-- · update_vtli_post_status ya marca reviewed_at = NOW() al aprobar,
--   así que get_recent_pulsos_nucleo va a pickear los pulsos aprobados
--   más recientes sin trabajo adicional.
-- · El pulso_nucleo se guarda en el INSERT inicial (status='draft').
--   Al aprobar, simplemente cambia status; el pulso ya está ahí.
--
-- Validar:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='vtli_posts' AND column_name='pulso_nucleo';
--   SELECT get_recent_pulsos_nucleo('veo', 10);
-- ============================================================
