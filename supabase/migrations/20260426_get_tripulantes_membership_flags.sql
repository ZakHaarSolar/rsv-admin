-- Red Solar Viva · get_tripulantes_membership_flags
-- =====================================================================
-- Batch lookup que devuelve flags is_subscriber + is_admin para una
-- lista de clerk_user_ids. Lo consume el grid de Tripulantes Activos
-- del Motor de Intervención para pintar cada tarjeta DORADA cuando el
-- tripulante tiene Sintonía Solar activa o es admin.
--
-- Antes: el modal abierto sí distinguía suscriptores con tema dorado
-- (vía get_tripulante_extras), pero las miniaturas del grid se veían
-- todas iguales. Diego pidió la misma señal visible desde el grid sin
-- tener que abrir cada modal. Esta RPC entrega los flags por todos los
-- tripulantes en una sola llamada (no N llamadas a get_tripulante_extras).
--
-- SECURITY DEFINER + admin gate (mismo patrón que get_tripulante_extras
-- y delete_user_scan_data_admin). Tabla `subscriptions` cruzada por
-- email de profiles → cualquier sub activa marca al tripulante como
-- gold (Sintonía o Inmersión). Admin viene directo de profiles.is_admin.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION get_tripulantes_membership_flags(
    p_clerk_ids      TEXT[],
    p_admin_clerk_id TEXT
)
RETURNS TABLE (
    clerk_user_id TEXT,
    is_subscriber BOOLEAN,
    is_admin      BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        p.clerk_user_id::TEXT,
        EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.email = p.email
              AND s.status = 'active'
        ) AS is_subscriber,
        COALESCE(p.is_admin, false) AS is_admin
    FROM profiles p
    WHERE p.clerk_user_id = ANY(p_clerk_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION get_tripulantes_membership_flags(TEXT[], TEXT)
    TO anon, authenticated;
