-- Red Solar Viva · EMBUDO DEL ONBOARDING (2026-07-13)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
--
-- Mide hasta dónde llegan los usuarios NUEVOS en el OnboardingV2 (12
-- pantallas + paywall) SIN identidad: el cliente genera un uuid anónimo
-- local y reporta el paso visto; acá se guarda UNA fila por instalación
-- con el paso MÁXIMO alcanzado (upsert idempotente — repetir o retroceder
-- no ensucia). Paso 13 = llegó al paywall (completó el onboarding).
-- Lectura SOLO admin (get_onb_funnel via gateway admin-action).
-- Retención: purga oportunista a 120 días (patrón nav_events).

CREATE TABLE IF NOT EXISTS public.onb_funnel (
    anon_id uuid PRIMARY KEY,
    max_step int NOT NULL DEFAULT 0,
    completed boolean NOT NULL DEFAULT false,
    platform text,
    started_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onb_funnel ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.onb_funnel FROM PUBLIC, anon, authenticated;

-- ── Registro anónimo (lo llama el cliente con la anon key, pre-login) ──
CREATE OR REPLACE FUNCTION public.record_onb_step(
    p_anon uuid,
    p_step int,
    p_platform text DEFAULT NULL
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
    INSERT INTO public.onb_funnel (anon_id, max_step, completed, platform)
    VALUES (p_anon, p_step, p_step >= 13, left(coalesce(p_platform, ''), 12))
    ON CONFLICT (anon_id) DO UPDATE
        SET max_step = GREATEST(public.onb_funnel.max_step, EXCLUDED.max_step),
            completed = public.onb_funnel.completed OR EXCLUDED.completed,
            updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.record_onb_step(uuid, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_onb_step(uuid, int, text)
    TO anon, authenticated, service_role;

-- ── Lectura admin (via gateway admin-action; REVOKE directo) ──────────
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
    )
    SELECT json_build_object(
        'total', (SELECT count(*) FROM base),
        'completed', (SELECT count(*) FROM base WHERE completed),
        'ios', (SELECT count(*) FROM base WHERE platform = 'ios'),
        'android', (SELECT count(*) FROM base WHERE platform = 'android'),
        'web', (SELECT count(*) FROM base WHERE platform = 'web'),
        'steps', (
            SELECT json_agg(
                json_build_object(
                    'step', gs.step,
                    'reached',
                    (SELECT count(*) FROM base WHERE max_step >= gs.step)
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

NOTIFY pgrst, 'reload schema';
