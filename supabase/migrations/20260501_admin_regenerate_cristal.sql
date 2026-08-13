-- 20260501_admin_regenerate_cristal.sql
-- RPC `admin_regenerate_cristal(p_clerk_user_id, p_tipo)` — emite un
-- cristal nuevo (origen='manual') al admin caller si no tiene
-- cristales disponibles del tipo solicitado. Diseñada para que el
-- admin tenga cristales infinitos para testing: tras canjear uno, el
-- frontend espera 30s y llama esta RPC para re-generar otro.
--
-- Guardas:
--  · Verifica que el caller sea admin (profiles.is_admin = true).
--  · Solo emite si no hay cristales disponibles del tipo (idempotente
--    desde la perspectiva del usuario: nunca acumula más de uno).
--  · Solo afecta al propio caller.
--
-- mes_lunar = 'admin-test' para que estos cristales no choquen con
-- el filtro de idempotencia mensual de `emit_cristales_for_subscription`.

CREATE OR REPLACE FUNCTION public.admin_regenerate_cristal(
    p_clerk_user_id text,
    p_tipo text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
  v_existing int := 0;
BEGIN
  IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
    RETURN json_build_object('error', 'clerk_user_id_requerido');
  END IF;
  IF p_tipo NOT IN ('codice', 'meditacion') THEN
    RETURN json_build_object('error', 'tipo_invalido');
  END IF;

  SELECT is_admin INTO is_admin_user
  FROM profiles
  WHERE clerk_user_id = p_clerk_user_id;

  IF NOT COALESCE(is_admin_user, false) THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  -- ¿Ya tiene un cristal disponible del tipo? No emitir otro.
  SELECT count(*)::int INTO v_existing
  FROM cristales_extraccion
  WHERE clerk_user_id = p_clerk_user_id
    AND tipo = p_tipo
    AND canjeado_at IS NULL;

  IF v_existing > 0 THEN
    RETURN json_build_object(
      'success', true,
      'already_available', true,
      'count', v_existing
    );
  END IF;

  INSERT INTO cristales_extraccion
    (clerk_user_id, tipo, origen, mes_lunar)
  VALUES
    (p_clerk_user_id, p_tipo, 'manual', 'admin-test');

  RETURN json_build_object(
    'success', true,
    'regenerated', true
  );
END $$;

GRANT EXECUTE ON FUNCTION public.admin_regenerate_cristal(text, text)
    TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- RPC `is_admin_caller(p_clerk_user_id)` — helper para que el
-- frontend chequee si una sesión es admin sin necesidad de leer la
-- tabla profiles directo (RLS la cierra).
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin_caller(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
    RETURN json_build_object('is_admin', false);
  END IF;

  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE clerk_user_id = p_clerk_user_id;

  RETURN json_build_object('is_admin', COALESCE(v_is_admin, false));
END $$;

GRANT EXECUTE ON FUNCTION public.is_admin_caller(text)
    TO anon, authenticated, service_role;
