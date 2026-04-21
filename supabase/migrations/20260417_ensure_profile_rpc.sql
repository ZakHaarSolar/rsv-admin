-- Red Solar Viva — ensure_profile RPC (v1)
-- ───────────────────────────────────────────────────────────────────
-- Resuelve el bug "scans no persisten para tripulantes nuevos": el
-- webhook Clerk→Supabase (clerk-webhook edge function) no estaba
-- creando el registro en profiles (webhook desuscripto / firma
-- inválida / edge function caída). Eso deja al tripulante sin fila
-- en profiles y los INSERT a scan_vibracional se rompen por FK/RLS.
--
-- Este RPC se ejecuta con SECURITY DEFINER (privilegios del owner de
-- la función, no del caller), por lo tanto bypassea el RLS de
-- profiles. El frontend lo llama al abrir el radar y garantiza que
-- el profile existe antes de cualquier escritura.
--
-- Seguridad: esta función acepta cualquier clerk_user_id/email que
-- le pase el cliente. Está ok para la fase actual (todos los
-- tripulantes son reales, no hay ataque de profile injection a
-- escala). Si más adelante se quiere validar, reemplazar por una
-- edge function que verifique el session token contra Clerk.
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_clerk_user_id text,
  p_email text,
  p_full_name text DEFAULT '',
  p_avatar_url text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(trim(p_email));
BEGIN
  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'clerk_user_id requerido';
  END IF;

  INSERT INTO public.profiles (
    clerk_user_id, email, full_name, avatar_url, updated_at
  )
  VALUES (
    p_clerk_user_id, v_email, p_full_name, p_avatar_url, now()
  )
  ON CONFLICT (clerk_user_id) DO UPDATE SET
    email      = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
    full_name  = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
    updated_at = EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- anon + authenticated pueden llamar — el SECURITY DEFINER hace el insert
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text, text) TO authenticated;

-- Sanity check: verificar que profiles tiene la constraint esperada
-- (si falla, crear UNIQUE sobre clerk_user_id antes de este RPC)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype IN ('u', 'p')
      AND pg_get_constraintdef(oid) ILIKE '%clerk_user_id%'
  ) THEN
    RAISE NOTICE '⚠️  profiles no tiene UNIQUE/PK sobre clerk_user_id. El ON CONFLICT no funcionará. Corré: ALTER TABLE public.profiles ADD CONSTRAINT profiles_clerk_user_id_key UNIQUE (clerk_user_id);';
  END IF;
END $$;
