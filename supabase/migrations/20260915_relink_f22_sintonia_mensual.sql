-- Red Solar Viva · religar Sintonía mensual de F22 (user_3IIS…PL5O)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Qué pasó: el semanal venció el 13 sep. El 15 sep compró el mensual
-- bajo un $RCAnonymousID nuevo. El webhook escribió esa fila SIN
-- user_id (o ni la escribió). El Motor solo mira rc_user_<clerk>.
--
-- Este script: (1) religa cualquier fila del anónimo nuevo al Clerk
-- de F22 y la deja active; (2) si no hay fila, INSERTA el mensual
-- para que el padrón la pinte cian. Seguro de repetir.

DO $$
DECLARE
    v_clerk TEXT := 'user_3IISFe3GP2jwcsaY8MZSzFRPL5O';
    v_anon  TEXT := 'rc_$RCAnonymousID:a5c2160651e54b69b79f07bcbd270c07';
    v_cust  TEXT := 'rc_' || v_clerk;
    v_sub   TEXT := 'rc_apple_monthly_' || v_clerk;
    v_uid   UUID;
    v_email TEXT;
    v_name  TEXT;
    v_n     INT;
BEGIN
    SELECT p.id, p.email, p.full_name
      INTO v_uid, v_email, v_name
    FROM profiles p
    WHERE p.clerk_user_id = v_clerk
    LIMIT 1;

    UPDATE subscriptions s
    SET
        stripe_customer_id = v_cust,
        user_id = COALESCE(s.user_id, v_uid),
        email = COALESCE(s.email, v_email),
        customer_name = COALESCE(s.customer_name, v_name),
        status = 'active',
        group_name = 'sintonia',
        cancel_at_period_end = false,
        current_period_start = COALESCE(
            s.current_period_start,
            TIMESTAMPTZ '2026-09-15 10:17:00+00'
        ),
        current_period_end = GREATEST(
            COALESCE(s.current_period_end, '-infinity'::timestamptz),
            TIMESTAMPTZ '2026-10-15 10:17:00+00'
        )
    WHERE s.stripe_customer_id = v_anon
       OR s.stripe_customer_id ILIKE '%a5c2160651e54b69b79f07bcbd270c07%';

    GET DIAGNOSTICS v_n = ROW_COUNT;
    RAISE NOTICE 'filas religadas del anónimo: %', v_n;

    IF NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.status = 'active'
          AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
          AND s.group_name = 'sintonia'
          AND (
              s.user_id = v_uid
              OR s.stripe_customer_id = v_cust
          )
    ) THEN
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
            gen_random_uuid(),
            v_uid,
            v_email,
            v_sub,
            v_cust,
            'active',
            TIMESTAMPTZ '2026-09-15 10:17:00+00',
            TIMESTAMPTZ '2026-10-15 10:17:00+00',
            false,
            v_name,
            'sintonia'
        );
        RAISE NOTICE 'inserté mensual sintético %', v_sub;
    ELSE
        RAISE NOTICE 'ya hay sintonía active para F22; no inserté';
    END IF;
END $$;
