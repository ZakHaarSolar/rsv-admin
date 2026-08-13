-- Red Solar Viva · admin_activate_sintonia · v3 con cristales
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Bug observado 2026-05-02: el nodo "bores rivera" recibió cortesía
-- vía admin_activate_sintonia y, en el panel del Motor de Intervención,
-- mostraba 0 cristales de Códice y 0 cristales de Meditación a pesar
-- de tener Sintonía Solar activa. Causa: la RPC v2 inserta la row de
-- subscriptions con group_name='sintonia' pero NO llama a
-- emit_cristales_for_subscription. Para suscripciones reales de Stripe
-- ese llamado lo hace el stripe-webhook al confirmar pago; las
-- cortesías quedaban huérfanas del paso de emisión.
--
-- Cambios v3:
--   · Después del INSERT a subscriptions, llamamos directamente a
--     emit_cristales_for_subscription con origen='sintonia' y
--     mes_lunar = mes en curso. Esa RPC es idempotente por
--     (clerk_user_id, mes_lunar, origen), así que llamadas repetidas
--     dentro del mismo mes no duplican cristales.
--   · El return JSONB de la RPC ahora también incluye `cristales_emitted`
--     para que el frontend (TripulantesView) pueda confirmar el éxito.
--   · La sección de SQL al final corre un backfill one-shot que cura
--     a todos los nodos que ya tienen cortesía activa pero no
--     recibieron cristales (idempotente: si ya recibieron, skip).
--
-- Cómo aplicar:
--   1. Pegá el contenido completo de este archivo en el SQL Editor.
--   2. Run.
--   3. El bloque DO al final imprime cuántos cristales emitió el
--      backfill — debería listar al menos 2 (1 codice + 1 meditacion)
--      por cada nodo con cortesía activa que no los tenía.

DROP FUNCTION IF EXISTS public.admin_activate_sintonia(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_activate_sintonia(
    p_admin_clerk_id TEXT,
    p_target_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_email TEXT;
    v_target_user_id UUID;
    v_target_name TEXT;
    v_now TIMESTAMPTZ := now();
    v_period_end TIMESTAMPTZ := now() + interval '30 days';
    v_synthetic_sub_id TEXT;
    v_synthetic_cust_id TEXT;
    v_new_id UUID;
    v_mes_lunar TEXT := to_char(now(), 'YYYY-MM');
    v_cristales_result JSON;
BEGIN
    /* Admin gate. */
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

    /* Cargar datos del target. */
    SELECT
        COALESCE(p.email, ''),
        p.id,
        COALESCE(p.full_name, '')
    INTO v_target_email, v_target_user_id, v_target_name
    FROM profiles p
    WHERE p.clerk_user_id = p_target_clerk_id
    LIMIT 1;

    IF v_target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tripulante no encontrado en profiles'
        );
    END IF;

    /* IDs sintéticos únicos. */
    v_synthetic_sub_id := 'gift_sintonia_'
        || p_target_clerk_id
        || '_'
        || (EXTRACT(EPOCH FROM v_now)::BIGINT)::TEXT;
    v_synthetic_cust_id := 'gift_cust_' || p_target_clerk_id;
    v_new_id := gen_random_uuid();

    /* Insertar subscription. */
    INSERT INTO subscriptions (
        id,
        user_id,
        email,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        customer_name,
        group_name
    ) VALUES (
        v_new_id,
        v_target_user_id,
        NULLIF(v_target_email, ''),
        v_synthetic_sub_id,
        v_synthetic_cust_id,
        'active',
        v_now,
        v_period_end,
        true,
        NULLIF(v_target_name, ''),
        'sintonia'
    );

    /* v3 — Emitir cristales del mes en curso. Idempotente por
       (clerk_user_id, mes_lunar, origen): si ya recibió cristales
       este mes (caso poco común: re-cortesía en el mismo mes), no
       duplica. */
    v_cristales_result := public.emit_cristales_for_subscription(
        p_target_clerk_id,
        'sintonia',
        v_mes_lunar
    );

    RETURN jsonb_build_object(
        'success', true,
        'sub_id', v_synthetic_sub_id,
        'sub_uuid', v_new_id,
        'expires_at', v_period_end::TEXT,
        'target_email', v_target_email,
        'cristales_emitted', v_cristales_result
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

GRANT EXECUTE ON FUNCTION public.admin_activate_sintonia(TEXT, TEXT)
    TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Backfill: cura nodos con cortesía activa que no recibieron cristales
-- ─────────────────────────────────────────────────────────────────
-- Recorre todos los nodos con suscripción activa cuyo
-- stripe_subscription_id arranca con 'gift_sintonia_' (cortesías
-- creadas por esta RPC) y emite los cristales del mes en curso si
-- no los tenían. Idempotente: emit_cristales_for_subscription no
-- duplica si ya existen.

DO $$
DECLARE
    v_row RECORD;
    v_mes_lunar TEXT := to_char(now(), 'YYYY-MM');
    v_emit_result JSON;
    v_cured_count INT := 0;
    v_processed_count INT := 0;
BEGIN
    FOR v_row IN
        SELECT DISTINCT
            p.clerk_user_id,
            p.full_name,
            p.email
        FROM subscriptions s
        JOIN profiles p ON p.id = s.user_id
        WHERE s.status = 'active'
          AND s.group_name = 'sintonia'
          AND s.stripe_subscription_id LIKE 'gift_sintonia_%'
          AND p.clerk_user_id IS NOT NULL
          AND p.clerk_user_id <> ''
    LOOP
        v_processed_count := v_processed_count + 1;
        v_emit_result := public.emit_cristales_for_subscription(
            v_row.clerk_user_id,
            'sintonia',
            v_mes_lunar
        );
        IF (v_emit_result->>'emitted')::int > 0 THEN
            v_cured_count := v_cured_count + 1;
            RAISE NOTICE 'Cristales emitidos a % (% / %): %',
                v_row.clerk_user_id,
                COALESCE(v_row.full_name, ''),
                COALESCE(v_row.email, ''),
                v_emit_result;
        END IF;
    END LOOP;

    RAISE NOTICE 'Backfill cortesías: % nodos procesados, % curados con cristales nuevos',
        v_processed_count, v_cured_count;
END $$;
