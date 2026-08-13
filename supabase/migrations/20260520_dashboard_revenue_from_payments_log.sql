-- Red Solar Viva · Telemetría del Núcleo · revenue real desde payments_log
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Antes:
--   pulsar_rev_this / cuasar_rev_this / sintonia_rev_this eran COUNTS
--   de suscripciones cuyo `current_period_start` caía en el mes actual.
--   Telemetría los multiplicaba por P_INM (1999) o P_SINT (777) → daba
--   el "revenue" total ASUMIENDO precio lleno.
--
-- Problemas con ese enfoque:
--   1. Admin gift sub con `amount_cents=0` se contaba como 1,999 MXN.
--   2. Cupón PRIMERMES (-444 MXN, primer mes Inmersión 1,555) se contaba
--      como 1,999 MXN.
--   3. Cualquier descuento Stripe (admin promo, free trial, partial
--      refund) distorsionaba el revenue real.
--
-- Cambio: agregamos cuatro campos nuevos al RPC `get_admin_dashboard`:
--   · inmersion_rev_cents_this — SUM(amount_cents) de payments_log
--     para Inmersión (Púlsar + Cuásar) este mes.
--   · inmersion_rev_cents_prev — idem mes anterior.
--   · sintonia_rev_cents_this  — SUM(amount_cents) para Sintonía
--     este mes.
--   · sintonia_rev_cents_prev  — idem mes anterior.
--
-- Filtros aplicados a las queries de payments_log:
--   · payment_type = 'subscription'
--   · status = 'succeeded'
--   · paid_at en el rango del mes (huso América/Cancún)
--   · description coincide con el grupo (LIKE 'Inmersión%' o LIKE 'Sintonía%')
--   · stripe_subscription_id NOT LIKE 'gift_%' (regalos admin sin Stripe)
--   · email NO está en revenue_exclusions (cuentas de prueba)
--
-- Los campos `pulsar_rev_this`, `cuasar_rev_this`, `sintonia_rev_this`
-- (counts) se MANTIENEN intactos — Telemetría los sigue usando para el
-- cálculo de "Por Cobrar" (renewing - already_paid) ya que ese estimado
-- requiere proyectar precio lleno sobre suscriptores que aún no pagaron
-- en el mes.

CREATE OR REPLACE FUNCTION public.get_admin_dashboard(
    p_clerk_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
  m_start timestamptz;
  m_end timestamptz;
  pm_start timestamptz;
  current_month int;
  result json;
BEGIN
  SELECT is_admin INTO is_admin_user
  FROM profiles WHERE clerk_user_id = p_clerk_id;
  IF NOT COALESCE(is_admin_user, false) THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  m_start  := date_trunc('month', now() AT TIME ZONE 'America/Cancun') AT TIME ZONE 'America/Cancun';
  m_end    := m_start + interval '1 month';
  pm_start := m_start - interval '1 month';
  current_month := EXTRACT(MONTH FROM now() AT TIME ZONE 'America/Cancun')::int;

  SELECT json_build_object(
    'pulsar_active',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND COALESCE(s.group_name,'pulsar') = 'pulsar' AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_active',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'cuasar' AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_active', (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'sintonia' AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    'pulsar_rev_this',   (SELECT count(*) FROM subscriptions s WHERE COALESCE(s.group_name,'pulsar') = 'pulsar' AND s.current_period_start >= m_start AND s.current_period_start < m_end AND s.status NOT IN ('incomplete','incomplete_expired') AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_rev_this',   (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'cuasar' AND s.current_period_start >= m_start AND s.current_period_start < m_end AND s.status NOT IN ('incomplete','incomplete_expired') AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_rev_this', (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'sintonia' AND s.current_period_start >= m_start AND s.current_period_start < m_end AND s.status NOT IN ('incomplete','incomplete_expired') AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    'pulsar_rev_prev',   (SELECT count(*) FROM subscriptions s WHERE COALESCE(s.group_name,'pulsar') = 'pulsar' AND s.current_period_start >= pm_start AND s.current_period_start < m_start AND s.status NOT IN ('incomplete','incomplete_expired') AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_rev_prev',   (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'cuasar' AND s.current_period_start >= pm_start AND s.current_period_start < m_start AND s.status NOT IN ('incomplete','incomplete_expired') AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_rev_prev', (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'sintonia' AND s.current_period_start >= pm_start AND s.current_period_start < m_start AND s.status NOT IN ('incomplete','incomplete_expired') AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    'pulsar_renewing',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND COALESCE(s.group_name,'pulsar') = 'pulsar' AND s.cancel_at_period_end = false AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_renewing',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'cuasar' AND s.cancel_at_period_end = false AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_renewing', (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'sintonia' AND s.cancel_at_period_end = false AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    -- ═══ NUEVO 2026-05-20 — revenue real desde payments_log ═══
    -- Suma exactamente los cents pagados. Refleja descuentos PRIMERMES,
    -- admin promos, refunds parciales y cualquier ajuste Stripe.
    'inmersion_rev_cents_this', (
      SELECT COALESCE(SUM(p.amount_cents), 0)
      FROM payments_log p
      WHERE p.payment_type = 'subscription'
        AND p.status = 'succeeded'
        AND p.paid_at >= m_start AND p.paid_at < m_end
        AND p.description LIKE 'Inmersi%'
        AND COALESCE(p.stripe_subscription_id, '') NOT LIKE 'gift_%'
        AND NOT EXISTS (
          SELECT 1 FROM revenue_exclusions e
          WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(p.email))
        )
    ),
    'inmersion_rev_cents_prev', (
      SELECT COALESCE(SUM(p.amount_cents), 0)
      FROM payments_log p
      WHERE p.payment_type = 'subscription'
        AND p.status = 'succeeded'
        AND p.paid_at >= pm_start AND p.paid_at < m_start
        AND p.description LIKE 'Inmersi%'
        AND COALESCE(p.stripe_subscription_id, '') NOT LIKE 'gift_%'
        AND NOT EXISTS (
          SELECT 1 FROM revenue_exclusions e
          WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(p.email))
        )
    ),
    'sintonia_rev_cents_this', (
      SELECT COALESCE(SUM(p.amount_cents), 0)
      FROM payments_log p
      WHERE p.payment_type = 'subscription'
        AND p.status = 'succeeded'
        AND p.paid_at >= m_start AND p.paid_at < m_end
        AND p.description LIKE 'Sinton%'
        AND COALESCE(p.stripe_subscription_id, '') NOT LIKE 'gift_%'
        AND NOT EXISTS (
          SELECT 1 FROM revenue_exclusions e
          WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(p.email))
        )
    ),
    'sintonia_rev_cents_prev', (
      SELECT COALESCE(SUM(p.amount_cents), 0)
      FROM payments_log p
      WHERE p.payment_type = 'subscription'
        AND p.status = 'succeeded'
        AND p.paid_at >= pm_start AND p.paid_at < m_start
        AND p.description LIKE 'Sinton%'
        AND COALESCE(p.stripe_subscription_id, '') NOT LIKE 'gift_%'
        AND NOT EXISTS (
          SELECT 1 FROM revenue_exclusions e
          WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(p.email))
        )
    ),

    'subscribers', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'email', s.email, 'name', COALESCE(s.customer_name, s.email),
          'grp', COALESCE(s.group_name, 'pulsar'), 'status', s.status,
          'cancel', s.cancel_at_period_end, 'p_start', s.current_period_start,
          'p_end', s.current_period_end, 'created', s.created_at,
          'months', GREATEST(1, (EXTRACT(EPOCH FROM age(now(), s.created_at)) / 2592000)::int)
        ) ORDER BY s.created_at ASC
      ), '[]'::json)
      FROM subscriptions s
      WHERE s.status IN ('active', 'trialing', 'past_due')
        AND COALESCE(s.stripe_subscription_id,'') NOT LIKE 'gift_%'
        AND NOT EXISTS (
          SELECT 1 FROM revenue_exclusions e
          WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email))
        )
    ),

    'books_this_count', (
      SELECT count(*) FROM purchases
      WHERE purchased_at >= m_start AND purchased_at < m_end
        AND acquired_via = 'pago'
    ),
    'books_this_revenue', (
      SELECT COALESCE(SUM(amount_cents), 0) FROM purchases
      WHERE purchased_at >= m_start AND purchased_at < m_end
        AND acquired_via = 'pago'
    ),
    'books_this', (
      SELECT COALESCE(json_agg(json_build_object(
        'title', COALESCE(b.title, 'Códice'),
        'fmt', p.formats_purchased,
        'dt', p.purchased_at,
        'amount', p.amount_cents
      )), '[]'::json)
      FROM purchases p
      LEFT JOIN books b ON b.id = p.book_id
      WHERE p.purchased_at >= m_start AND p.purchased_at < m_end
        AND p.acquired_via = 'pago'
    ),
    'books_prev_count', (
      SELECT count(*) FROM purchases
      WHERE purchased_at >= pm_start AND purchased_at < m_start
        AND acquired_via = 'pago'
    ),
    'books_prev_revenue', (
      SELECT COALESCE(SUM(amount_cents), 0) FROM purchases
      WHERE purchased_at >= pm_start AND purchased_at < m_start
        AND acquired_via = 'pago'
    ),
    'books_prev', (
      SELECT COALESCE(json_agg(json_build_object(
        'title', COALESCE(b.title, 'Códice'),
        'fmt', p.formats_purchased,
        'dt', p.purchased_at,
        'amount', p.amount_cents
      )), '[]'::json)
      FROM purchases p
      LEFT JOIN books b ON b.id = p.book_id
      WHERE p.purchased_at >= pm_start AND p.purchased_at < m_start
        AND p.acquired_via = 'pago'
    ),

    'expenses', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', e.id, 'title', e.title, 'amount', e.amount,
          'frequency', e.frequency, 'category', e.category,
          'notes', e.notes, 'is_active', e.is_active,
          'billing_day', e.billing_day, 'billing_month', e.billing_month
        ) ORDER BY e.created_at ASC
      ), '[]'::json)
      FROM operational_expenses e WHERE e.is_active = true
    ),

    'current_month', current_month

  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard(text)
    TO anon, authenticated, service_role;
