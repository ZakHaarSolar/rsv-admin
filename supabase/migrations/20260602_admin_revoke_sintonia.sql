-- Red Solar Viva · admin_revoke_sintonia · v1
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Espejo de admin_activate_sintonia: desactiva (cancela) las cortesías
-- Sintonía Solar de un Tripulante con 1 click desde el Motor de
-- Intervención. Usado para preparar cuentas de revisión de Apple sin
-- membresía (que el muro de pago / In-App Purchase sea visible) y para
-- retirar cortesías en general.
--
-- SEGURIDAD: solo toca filas sintéticas de cortesía
-- (stripe_subscription_id LIKE 'gift_sintonia_%'). NUNCA cancela una
-- suscripción real de Stripe — esas se gestionan desde el portal de
-- Stripe / webhook. Si el Tripulante no tiene ninguna cortesía activa,
-- devuelve success=true con revoked=0 (idempotente).
--
-- Efecto: status='canceled' + current_period_end=now() en la(s)
-- cortesía(s) activa(s). El Tripulante pasa a Explorador al instante:
-- la detección de membresía del Escáner (subscriptions status=active)
-- y de Mi Núcleo (isSubActive) dejan de verlo como miembro, así que
-- los gates de Sintonía y el botón "Activar Sintonía Solar" del IAP
-- vuelven a aparecer.

DROP FUNCTION IF EXISTS public.admin_revoke_sintonia(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_revoke_sintonia(
    p_admin_clerk_id TEXT,
    p_target_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id UUID;
    v_revoked INT := 0;
    v_now TIMESTAMPTZ := now();
BEGIN
    /* Admin gate. Tolera perfiles duplicados: basta con que CUALQUIER
       fila del admin tenga is_admin=true. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized'
        );
    END IF;

    /* Resolver el target. */
    SELECT p.id
    INTO v_target_user_id
    FROM profiles p
    WHERE p.clerk_user_id = p_target_clerk_id
    LIMIT 1;

    IF v_target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tripulante no encontrado en profiles'
        );
    END IF;

    /* Cancelar SOLO cortesías activas (gift_sintonia_%). Nunca una
       suscripción real de Stripe. */
    UPDATE subscriptions
    SET status = 'canceled',
        cancel_at_period_end = true,
        current_period_end = v_now
    WHERE user_id = v_target_user_id
      AND status = 'active'
      AND stripe_subscription_id LIKE 'gift_sintonia_%';

    GET DIAGNOSTICS v_revoked = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'revoked', v_revoked
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_sintonia(TEXT, TEXT)
    TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Atajo one-shot: desactivar la cortesía de la cuenta de revisión de
-- Apple AHORA, para no esperar al botón. Idempotente.
-- ─────────────────────────────────────────────────────────────────
UPDATE subscriptions s
SET status = 'canceled',
    cancel_at_period_end = true,
    current_period_end = now()
FROM profiles p
WHERE p.id = s.user_id
  AND p.email = 'apple.review@redsolarviva.com'
  AND s.status = 'active'
  AND s.stripe_subscription_id LIKE 'gift_sintonia_%';
