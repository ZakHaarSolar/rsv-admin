-- Red Solar Viva — admin_create_exploration_pass RPC (v1)
-- ───────────────────────────────────────────────────────────────────
-- Permite a un ADMIN registrar manualmente un Pase de Exploración
-- desde la UI de Telemetría del Núcleo (para reservas off-platform:
-- transferencia, efectivo, compromiso verbal). Valida admin via
-- profiles.is_admin antes de insertar.
--
-- Por qué este RPC existe:
--   La tabla public.exploration_passes tiene RLS activo. El flujo
--   normal (Calendly → webhook Pipedream → Supabase service role)
--   sí pasa, pero desde el navegador con anon key se bloquea con
--   401 "new row violates row-level security policy".
--
-- SECURITY DEFINER hace que el INSERT se ejecute con los privilegios
-- del owner de la función (no del anon key caller), bypasseando RLS.
-- La validación de admin ocurre dentro de la función — si el caller
-- no es admin, la función lanza 42501 (insufficient_privilege).
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_create_exploration_pass(
  p_clerk_user_id text,
  p_name text,
  p_email text,
  p_event_date date,
  p_event_start_time timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_is_admin boolean;
BEGIN
  -- Validaciones básicas
  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'clerk_user_id requerido' USING ERRCODE = '22023';
  END IF;
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'email requerido' USING ERRCODE = '22023';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'nombre requerido' USING ERRCODE = '22023';
  END IF;
  IF p_event_date IS NULL OR p_event_start_time IS NULL THEN
    RAISE EXCEPTION 'event_date y event_start_time requeridos' USING ERRCODE = '22023';
  END IF;

  -- Verificar que el caller sea admin
  SELECT is_admin INTO v_is_admin
  FROM public.profiles
  WHERE clerk_user_id = p_clerk_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'not authorized — admin required' USING ERRCODE = '42501';
  END IF;

  -- Insertar (calendly_event_uri queda NULL porque es una entrada manual)
  INSERT INTO public.exploration_passes (
    name,
    email,
    event_date,
    event_start_time,
    calendly_event_uri
  ) VALUES (
    trim(p_name),
    lower(trim(p_email)),
    p_event_date,
    p_event_start_time,
    NULL
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- anon + authenticated pueden EXECUTE; la validación de admin ocurre dentro
REVOKE ALL ON FUNCTION public.admin_create_exploration_pass(text, text, text, date, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_exploration_pass(text, text, text, date, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_create_exploration_pass(text, text, text, date, timestamptz) TO authenticated;
