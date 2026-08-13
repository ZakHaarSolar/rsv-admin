-- Red Solar Viva · RESPUESTAS del embudo del onboarding (2026-07-15)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
--
-- Extiende el embudo anónimo (20260713_onb_funnel) para guardar, por
-- instalación, QUÉ contestó en las 4 preguntas del quiz (sin identidad:
-- sigue siendo el uuid local, cero correo/nombre). El Motor lo muestra
-- como "Usuario 1, 2…" con hasta dónde llegó + sus respuestas, para
-- afinar el onboarding con data real.
--
-- Idempotente / re-ejecutable. Pareja: admin-action (suma
-- get_onb_sessions) + redeploy, y el cliente OnboardingV2 (envía p_answers).

-- ── 1) Columna de respuestas ────────────────────────────────────────
ALTER TABLE public.onb_funnel
    ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── 2) record_onb_step: acepta p_answers y las MERGEA (no borra) ─────
-- La firma vieja (uuid,int,text) se reemplaza por (uuid,int,text,jsonb)
-- con p_answers DEFAULT NULL → el cliente viejo (3 args) sigue resolviendo.
DROP FUNCTION IF EXISTS public.record_onb_step(uuid, int, text);

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
        p_step >= 13,
        left(coalesce(p_platform, ''), 12),
        COALESCE(p_answers, '{}'::jsonb)
    )
    ON CONFLICT (anon_id) DO UPDATE
        SET max_step   = GREATEST(public.onb_funnel.max_step, EXCLUDED.max_step),
            completed  = public.onb_funnel.completed OR EXCLUDED.completed,
            -- Mergea las respuestas nuevas sobre las guardadas (no las pierde).
            answers    = public.onb_funnel.answers || COALESCE(p_answers, '{}'::jsonb),
            updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.record_onb_step(uuid, int, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_onb_step(uuid, int, text, jsonb)
    TO anon, authenticated, service_role;

-- ── 3) Lectura admin: sesiones individuales (Usuario 1, 2…) ─────────
CREATE OR REPLACE FUNCTION public.get_onb_sessions(
    p_admin_clerk_id text,
    p_days           int DEFAULT 30,
    p_limit          int DEFAULT 300
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
    v_out   json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(json_agg(row_to_json(s) ORDER BY s.updated_at DESC), '[]'::json)
    INTO v_out
    FROM (
        SELECT
            anon_id,
            max_step,
            completed,
            platform,
            answers,
            started_at,
            updated_at
        FROM public.onb_funnel
        WHERE started_at > now() - make_interval(days => GREATEST(p_days, 1))
        ORDER BY updated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 1000), 1)
    ) s;

    RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public.get_onb_sessions(text, int, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_onb_sessions(text, int, int) TO service_role;

NOTIFY pgrst, 'reload schema';
