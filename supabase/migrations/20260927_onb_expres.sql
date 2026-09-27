-- Red Solar Viva · EMBUDO · BIENVENIDA EXPRÉS (2026-09-27)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
--
-- La bienvenida exprés (OnboardingV2 v2.11, switch growth_onb_completo
-- ausente) reporta el paso 14 = "entró directo desde el Portal", sin quiz
-- y sin paywall. Sin este ajuste el panel lo contaría como si hubiera
-- llegado al paywall (13) y inflaría todas las barras del recorrido
-- completo. Este archivo:
--   (1) record_onb_step: `completed` significa SOLO "llegó al paywall" (13).
--   (2) get_onb_funnel: devuelve 'expres' (cuántos entraron directo) y
--       calcula las barras 1-13 sin esas instalaciones.
--   (3) corrige las filas exprés que se hayan marcado como completadas
--       antes de pegar esto.
-- Idempotente: se puede correr dos veces sin daño.

CREATE OR REPLACE FUNCTION public.record_onb_step(
    p_anon     uuid,
    p_step     int,
    p_platform text  DEFAULT NULL,
    p_answers  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_anon IS NULL OR p_step IS NULL OR p_step < 1 OR p_step > 20 THEN
        RETURN;
    END IF;
    /* Purga oportunista (~2% de los inserts): retención 120 días. */
    IF random() < 0.02 THEN
        DELETE FROM public.onb_funnel
        WHERE updated_at < now() - interval '120 days';
    END IF;
    INSERT INTO public.onb_funnel (anon_id, max_step, completed, platform, answers)
    VALUES (
        p_anon,
        p_step,
        -- 13 = llegó al paywall. El 14 (exprés) NO es "completó el paywall".
        p_step = 13,
        left(coalesce(p_platform, ''), 12),
        COALESCE(p_answers, '{}'::jsonb)
    )
    ON CONFLICT (anon_id) DO UPDATE
        SET max_step   = GREATEST(public.onb_funnel.max_step, EXCLUDED.max_step),
            completed  = public.onb_funnel.completed OR EXCLUDED.completed,
            answers    = public.onb_funnel.answers || COALESCE(p_answers, '{}'::jsonb),
            updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.record_onb_step(uuid, int, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_onb_step(uuid, int, text, jsonb)
    TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_onb_funnel(
    p_admin_clerk_id text,
    p_days int DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
    v_out json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    WITH base AS (
        SELECT max_step, completed, platform
        FROM public.onb_funnel
        WHERE started_at > now() - make_interval(days => GREATEST(p_days, 1))
    ),
    -- Recorrido completo: todo lo que no entró por la exprés (paso 14).
    largo AS (
        SELECT max_step FROM base WHERE max_step <= 13
    )
    SELECT json_build_object(
        'total', (SELECT count(*) FROM base),
        'completed', (SELECT count(*) FROM base WHERE completed),
        'expres', (SELECT count(*) FROM base WHERE max_step = 14),
        'ios', (SELECT count(*) FROM base WHERE platform = 'ios'),
        'android', (SELECT count(*) FROM base WHERE platform = 'android'),
        'web', (SELECT count(*) FROM base WHERE platform = 'web'),
        'steps', (
            SELECT json_agg(
                json_build_object(
                    'step', gs.step,
                    'reached',
                    (SELECT count(*) FROM largo WHERE max_step >= gs.step)
                )
                ORDER BY gs.step
            )
            FROM generate_series(1, 13) AS gs(step)
        )
    ) INTO v_out;
    RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public.get_onb_funnel(text, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_onb_funnel(text, int) TO service_role;

-- Filas exprés marcadas como "completó" antes de este ajuste.
UPDATE public.onb_funnel SET completed = false
WHERE max_step = 14 AND completed;

NOTIFY pgrst, 'reload schema';
