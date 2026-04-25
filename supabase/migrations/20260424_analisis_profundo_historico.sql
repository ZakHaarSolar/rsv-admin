-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Histórico de Análisis Profundos (2026-04-24)
--
-- Cada vez que el Arquitecto solicita un Análisis Profundo del Sprint,
-- el resultado queda anclado en esta tabla. Se muestra al fondo del
-- Observatorio Macro como grid de tarjetas clickeables (reabrir análisis
-- previos sin volver a llamar a Gemini = $0).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.analisis_profundo (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitado_por  TEXT NOT NULL,                    -- clerk_user_id del admin
    fechas          TEXT[] NOT NULL DEFAULT '{}',     -- fechas de las sesiones cruzadas
    n_sesiones      INT NOT NULL DEFAULT 0,
    modelo          TEXT,                             -- gemini-3.1-pro-preview, etc
    proyeccion      JSONB NOT NULL,                   -- {tema_sugerido, sintesis_corriente, ...}
    usage           JSONB,                            -- tokens in/out
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analisis_profundo_created ON public.analisis_profundo (created_at DESC);
ALTER TABLE public.analisis_profundo ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service_role (edge function) escribe, RPC admin-gated lee.

-- ────────────────────────────────────────────────────────────────
-- RPC · save_analisis_profundo (llamado desde la edge function con service_role)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_analisis_profundo(
    p_solicitado_por TEXT,
    p_fechas         TEXT[],
    p_n_sesiones     INT,
    p_modelo         TEXT,
    p_proyeccion     JSONB,
    p_usage          JSONB
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.analisis_profundo
        (solicitado_por, fechas, n_sesiones, modelo, proyeccion, usage)
    VALUES
        (p_solicitado_por, p_fechas, p_n_sesiones, p_modelo, p_proyeccion, p_usage)
    RETURNING id INTO v_id;
    RETURN json_build_object('success', TRUE, 'id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_analisis_profundo(TEXT, TEXT[], INT, TEXT, JSONB, JSONB) TO service_role;

-- ────────────────────────────────────────────────────────────────
-- RPC · list_analisis_profundo_admin (admin-gated)
--   Devuelve los últimos N análisis para el grid histórico.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_analisis_profundo_admin(
    p_clerk_id TEXT,
    p_limit    INT DEFAULT 20
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN COALESCE((
        SELECT json_agg(row_to_json(a) ORDER BY a.created_at DESC)
        FROM (
            SELECT id, solicitado_por, fechas, n_sesiones, modelo,
                   proyeccion, usage, created_at
            FROM public.analisis_profundo
            ORDER BY created_at DESC
            LIMIT COALESCE(p_limit, 20)
        ) a
    ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_analisis_profundo_admin(TEXT, INT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- RPC · delete_analisis_profundo_admin (admin-gated, por si limpiás)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_analisis_profundo_admin(
    p_clerk_id TEXT,
    p_id       UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;
    DELETE FROM public.analisis_profundo WHERE id = p_id;
    RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_analisis_profundo_admin(TEXT, UUID) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
