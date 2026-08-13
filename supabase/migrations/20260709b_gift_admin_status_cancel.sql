-- Red Solar Viva · Estado y cancelación del REGALO de Sintonía (Motor)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Complementa 20260629b_gift_sintonia.sql. Da al Motor de Intervención dos
-- capacidades sobre el regalo de Sintonía de un nodo:
--
--   admin_get_gift_status  → ¿el nodo tiene un regalo PENDIENTE (ofrecido,
--     sin aceptar) o ACEPTADO (Sintonía de regalo activa)? El Motor muestra
--     "Regalo Sintonía Solar: pendiente" en vez de ofrecer otra vez.
--
--   admin_cancel_gift_offer → CANCELA la invitación PENDIENTE: borra el
--     gift_offer no reclamado del nodo, así deja de aparecer la tarjeta /
--     celebración en Mi Núcleo y ya no puede aceptarla. (La notificación push
--     que ya salió no se puede des-enviar; esto solo retira la invitación.)
--     Las ya aceptadas NO se tocan aquí — esas se retiran con
--     admin_revoke_sintonia (botón "Revocar Sintonía").
--
-- Seguridad: ambas por gateway admin-action (p_admin_clerk_id inyectado del
-- token verificado). REVOKE anon/authenticated; solo service_role.

-- ── Admin: estado del regalo del nodo (pendiente / aceptado) ──────────
CREATE OR REPLACE FUNCTION public.admin_get_gift_status(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id uuid;
    v_pending  boolean := false;
    v_accepted boolean := false;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Regalo PENDIENTE: un gift_offer sin reclamar.
    v_pending := EXISTS (
        SELECT 1 FROM gift_offers
        WHERE clerk_user_id = p_target_clerk_id AND claimed_at IS NULL
    );

    -- Regalo ACEPTADO: cortesía sintética activa (gift_sintonia_%).
    SELECT p.id INTO v_target_user_id
    FROM profiles p WHERE p.clerk_user_id = p_target_clerk_id LIMIT 1;
    IF v_target_user_id IS NOT NULL THEN
        v_accepted := EXISTS (
            SELECT 1 FROM subscriptions
            WHERE user_id = v_target_user_id
              AND status = 'active'
              AND stripe_subscription_id LIKE 'gift_sintonia_%'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'pending', v_pending,
        'accepted', v_accepted
    );
END;
$$;

-- ── Admin: cancelar la invitación PENDIENTE (no toca las aceptadas) ────
CREATE OR REPLACE FUNCTION public.admin_cancel_gift_offer(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cancelled int := 0;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Borra SOLO las invitaciones pendientes (claimed_at IS NULL). Las ya
    -- aceptadas quedan intactas (se retiran con admin_revoke_sintonia).
    DELETE FROM gift_offers
    WHERE clerk_user_id = p_target_clerk_id AND claimed_at IS NULL;
    GET DIAGNOSTICS v_cancelled = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'cancelled', v_cancelled);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Locks: solo service_role (gateway admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_gift_status(text, text)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_gift_offer(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_gift_status(text, text)   TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_cancel_gift_offer(text, text) TO service_role;
