-- Red Solar Viva — exploration_passes.group_name + RPC v2
-- ───────────────────────────────────────────────────────────────────
-- Añade la columna group_name a exploration_passes para que
-- Ignicion.js pueda filtrar exploradores por sesión (Púlsar 12:30 PM
-- o Cuásar 4:30 PM) exactamente igual que lo hace con suscripciones.
--
-- Antes, Ignicion traía TODOS los exploradores con event_date = hoy,
-- así que un explorador caía en el pool de AMBOS crons (11:30 AM
-- para Púlsar y 3:30 PM para Cuásar) y recibía dos emails. Con
-- group_name, filtramos con `.eq("group_name", targetGroup)` y
-- mandamos 1 solo email al grupo correcto.
--
-- También actualiza admin_create_exploration_pass para aceptar el
-- nuevo parámetro p_group_name (nullable, backwards-compat).
-- ───────────────────────────────────────────────────────────────────

-- 1. Columna group_name (nullable para backwards compat con filas viejas)
ALTER TABLE public.exploration_passes
    ADD COLUMN IF NOT EXISTS group_name text
    CHECK (group_name IS NULL OR group_name IN ('pulsar', 'cuasar'));

-- 2. Backfill opcional — inferir grupo de event_start_time para filas
--    históricas (útil si ya hay pases registrados sin group_name).
--    Cancún = UTC-5 sin DST, así que comparamos la hora UTC del
--    event_start_time: < 17 UTC (antes de mediodía Cancún) → pulsar,
--    >= 17 UTC → cuasar. Funciona porque Púlsar es 12:30 PM Cancún
--    (17:30 UTC) y Cuásar es 4:30 PM Cancún (21:30 UTC).
UPDATE public.exploration_passes
SET group_name = CASE
    WHEN extract(hour from event_start_time AT TIME ZONE 'UTC') < 19
    THEN 'pulsar'
    ELSE 'cuasar'
END
WHERE group_name IS NULL AND event_start_time IS NOT NULL;

-- 3. RPC v2 — acepta p_group_name opcional. Si viene, se guarda; si no,
--    queda NULL (igual que una fila legacy).
CREATE OR REPLACE FUNCTION public.admin_create_exploration_pass(
  p_clerk_user_id text,
  p_name text,
  p_email text,
  p_event_date date,
  p_event_start_time timestamptz,
  p_group_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_is_admin boolean;
  v_group text;
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

  -- Validar group_name si viene
  v_group := lower(trim(coalesce(p_group_name, '')));
  IF v_group = '' THEN
    v_group := NULL;
  ELSIF v_group NOT IN ('pulsar', 'cuasar') THEN
    RAISE EXCEPTION 'group_name inválido (debe ser pulsar o cuasar)' USING ERRCODE = '22023';
  END IF;

  -- Verificar que el caller sea admin
  SELECT is_admin INTO v_is_admin
  FROM public.profiles
  WHERE clerk_user_id = p_clerk_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'not authorized — admin required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.exploration_passes (
    name,
    email,
    event_date,
    event_start_time,
    calendly_event_uri,
    group_name
  ) VALUES (
    trim(p_name),
    lower(trim(p_email)),
    p_event_date,
    p_event_start_time,
    NULL,
    v_group
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_exploration_pass(text, text, text, date, timestamptz, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_exploration_pass(text, text, text, date, timestamptz, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_create_exploration_pass(text, text, text, date, timestamptz, text) TO authenticated;
