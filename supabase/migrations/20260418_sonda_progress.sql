-- Red Solar Viva — sonda_progress: persistencia de progreso por pilar
-- ───────────────────────────────────────────────────────────────────
-- Feature: cuando un tripulante empieza a responder una sonda y se queda
-- a mitad (ej. pregunta 4 de 7), al cerrar sesión y volver debe retomar
-- exactamente donde quedó. Además puede navegar hacia atrás y cambiar
-- cualquier respuesta antes de finalizar el ciclo de ese pilar.
--
-- Diseño:
-- - Tabla `sonda_progress` con PK compuesto (clerk_user_id, pilar).
-- - Se UPSERT en cada pick del tripulante.
-- - Se DELETE cuando completa las N preguntas y dispara el processing
--   (porque ya no hay "progreso abierto" — el scan se guarda en
--   scan_vibracional como siempre).
-- - 3 RPCs con SECURITY DEFINER que bypassean RLS y son llamables por anon.
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sonda_progress (
  clerk_user_id text NOT NULL,
  pilar text NOT NULL,
  current_question integer NOT NULL DEFAULT 0,
  answers_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (clerk_user_id, pilar)
);

CREATE INDEX IF NOT EXISTS sonda_progress_updated_at_idx
  ON public.sonda_progress (updated_at DESC);

-- ─── RPC: save_sonda_progress (UPSERT) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.save_sonda_progress(
  p_clerk_user_id text,
  p_pilar text,
  p_current_question integer,
  p_answers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'clerk_user_id requerido';
  END IF;
  IF p_pilar IS NULL OR length(trim(p_pilar)) = 0 THEN
    RAISE EXCEPTION 'pilar requerido';
  END IF;

  INSERT INTO public.sonda_progress (
    clerk_user_id, pilar, current_question, answers_json, updated_at
  )
  VALUES (
    p_clerk_user_id, upper(p_pilar), GREATEST(0, p_current_question),
    COALESCE(p_answers, '[]'::jsonb), now()
  )
  ON CONFLICT (clerk_user_id, pilar) DO UPDATE SET
    current_question = EXCLUDED.current_question,
    answers_json     = EXCLUDED.answers_json,
    updated_at       = EXCLUDED.updated_at;
END;
$$;

-- ─── RPC: get_sonda_progress (SELECT 1 row) ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_sonda_progress(
  p_clerk_user_id text,
  p_pilar text
)
RETURNS TABLE (
  current_question integer,
  answers_json jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sp.current_question, sp.answers_json
  FROM public.sonda_progress sp
  WHERE sp.clerk_user_id = p_clerk_user_id
    AND sp.pilar         = upper(p_pilar)
  LIMIT 1;
END;
$$;

-- ─── RPC: clear_sonda_progress (DELETE al finalizar) ────────────────
CREATE OR REPLACE FUNCTION public.clear_sonda_progress(
  p_clerk_user_id text,
  p_pilar text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sonda_progress
  WHERE clerk_user_id = p_clerk_user_id
    AND pilar         = upper(p_pilar);
END;
$$;

-- ─── Permisos: anon + authenticated pueden llamar los RPCs ──────────
GRANT EXECUTE ON FUNCTION public.save_sonda_progress(text, text, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sonda_progress(text, text)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_sonda_progress(text, text)                TO anon, authenticated;

-- Revocar acceso directo a la tabla (solo vía RPCs)
REVOKE ALL ON public.sonda_progress FROM anon;
REVOKE ALL ON public.sonda_progress FROM authenticated;
