-- Red Solar Viva · admin_activate_sintonia · fix v2
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Bug del v1: el INSERT a `subscriptions` no completaba — la UI
-- mostraba "Activando..." y volvía al estado original sin error
-- visible y sin row creada en la tabla. Causa probable: la columna
-- `stripe_customer_id` tiene un constraint NOT NULL (la subscripción
-- real de Stripe siempre la trae poblada), y el v1 pasaba NULL.
-- Adicionalmente, agregamos manejo de error que devuelve el SQLERRM
-- al frontend para diagnóstico futuro.
--
-- Cambios:
--   · stripe_customer_id pasa de NULL a un id sintético
--     `gift_cust_<clerk_id>` (cumple cualquier constraint NOT NULL).
--   · El bloque EXCEPTION ahora también captura SQLSTATE para
--     distinguir tipo de error en logs server-side.
--   · El INSERT especifica explícitamente `id` con
--     `gen_random_uuid()` por si la columna no tiene DEFAULT
--     configurado (defensivo).

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

    /* IDs sintéticos únicos. El sub_id incluye epoch para idempotencia
       multi-llamada (cada activación genera una row nueva). El cust_id
       es por target — refleja que es "el cliente regalo de este
       Tripulante" sin necesidad de timestamp. */
    v_synthetic_sub_id := 'gift_sintonia_'
        || p_target_clerk_id
        || '_'
        || (EXTRACT(EPOCH FROM v_now)::BIGINT)::TEXT;
    v_synthetic_cust_id := 'gift_cust_' || p_target_clerk_id;
    v_new_id := gen_random_uuid();

    /* Insertar subscription. id explícito + stripe_customer_id
       sintético para cumplir cualquier constraint NOT NULL. */
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

    RETURN jsonb_build_object(
        'success', true,
        'sub_id', v_synthetic_sub_id,
        'sub_uuid', v_new_id,
        'expires_at', v_period_end::TEXT,
        'target_email', v_target_email
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
