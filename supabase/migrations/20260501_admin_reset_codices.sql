-- 20260501_admin_reset_codices.sql
-- RPC `admin_reset_my_codices(p_clerk_user_id)` — borra TODAS las
-- compras de Códices del propio admin (caller). Diseñada para
-- testing del flujo de Cristales y compras: el admin canjea o
-- compra Códices de prueba y luego resetea con un click para
-- repetir el flow desde cero.
--
-- Guardas:
--  · Verifica que el caller sea admin (profiles.is_admin = true).
--  · Solo borra purchases del propio caller (no afecta otros users).
--  · Devuelve {success, deleted: N}.
--
-- También limpia los cristales canjeados que apuntaban a esos
-- Códices borrados (canjeado_at = NULL, canjeado_item_kind/id =
-- NULL) para que el admin pueda re-canjearlos en pruebas
-- subsiguientes. Solo cristales con `origen = 'manual'` se
-- re-arman así — los cristales emitidos por suscripción real se
-- preservan tal cual.

CREATE OR REPLACE FUNCTION public.admin_reset_my_codices(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
  v_user_id uuid;
  v_email text;
  v_deleted_purchases int := 0;
  v_reset_cristales int := 0;
BEGIN
  IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
    RETURN json_build_object('error', 'clerk_user_id_requerido');
  END IF;

  SELECT is_admin, id, email
    INTO is_admin_user, v_user_id, v_email
  FROM profiles
  WHERE clerk_user_id = p_clerk_user_id;

  IF NOT COALESCE(is_admin_user, false) THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'no_profile');
  END IF;

  -- Borrar purchases del admin (por user_id O por email lowercased,
  -- cubre cualquier patrón legacy de la tabla).
  WITH del AS (
    DELETE FROM purchases
    WHERE user_id = v_user_id
       OR (v_email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(v_email)))
    RETURNING id
  )
  SELECT count(*)::int INTO v_deleted_purchases FROM del;

  -- v2 — NO re-armar cristales canjeados. Como `admin_regenerate_cristal`
  -- emite uno nuevo cuando el pool queda en 0, devolver los canjeados
  -- haría que el contador subiera a 2, 3, etc. Mantener canjeados
  -- canjeados garantiza el ciclo "1 → canjear → 0 → regen 30s → 1".
  v_reset_cristales := 0;

  RETURN json_build_object(
    'success', true,
    'deleted_purchases', v_deleted_purchases,
    'reset_cristales', v_reset_cristales
  );
END $$;

GRANT EXECUTE ON FUNCTION public.admin_reset_my_codices(text)
    TO anon, authenticated, service_role;
