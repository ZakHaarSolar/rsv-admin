-- 20260430_get_admin_dashboard_excluye_cristal.sql
-- Patch de `get_admin_dashboard` para que las 4 queries que leen
-- `purchases` excluyan las compras adquiridas con Cristal de
-- Extracción (acquired_via='cristal'). Esos canjes no son ingreso
-- real — son privilegio de membresía. La Telemetría del Núcleo
-- pinta:
--   · Conteo de Códices del mes (books_this_count / books_prev_count)
--   · Revenue de Códices del mes (books_this_revenue / books_prev_revenue)
--   · Lista de Códices del mes (books_this / books_prev)
-- Las tres dimensiones se filtran ahora con `acquired_via = 'pago'`.
--
-- El resto de la función (suscripciones, gastos, mes actual) se
-- mantiene intacto — solo retocamos los 6 puntos de `purchases`.
--
-- Importante: la columna `acquired_via` fue agregada en
-- 20260430_redeem_with_cristal.sql con DEFAULT 'pago' NOT NULL,
-- así que las filas históricas (anteriores a v3.20) tienen el valor
-- 'pago' sin necesidad de backfill — siguen contando como ingreso.

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
    'pulsar_active',   (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND COALESCE(group_name,'pulsar') = 'pulsar'),
    'cuasar_active',   (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND group_name = 'cuasar'),
    'sintonia_active', (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND group_name = 'sintonia'),

    'pulsar_rev_this',   (SELECT count(*) FROM subscriptions WHERE COALESCE(group_name,'pulsar') = 'pulsar' AND current_period_start >= m_start AND current_period_start < m_end AND status NOT IN ('incomplete','incomplete_expired')),
    'cuasar_rev_this',   (SELECT count(*) FROM subscriptions WHERE group_name = 'cuasar' AND current_period_start >= m_start AND current_period_start < m_end AND status NOT IN ('incomplete','incomplete_expired')),
    'sintonia_rev_this', (SELECT count(*) FROM subscriptions WHERE group_name = 'sintonia' AND current_period_start >= m_start AND current_period_start < m_end AND status NOT IN ('incomplete','incomplete_expired')),

    'pulsar_rev_prev',   (SELECT count(*) FROM subscriptions WHERE COALESCE(group_name,'pulsar') = 'pulsar' AND current_period_start >= pm_start AND current_period_start < m_start AND status NOT IN ('incomplete','incomplete_expired')),
    'cuasar_rev_prev',   (SELECT count(*) FROM subscriptions WHERE group_name = 'cuasar' AND current_period_start >= pm_start AND current_period_start < m_start AND status NOT IN ('incomplete','incomplete_expired')),
    'sintonia_rev_prev', (SELECT count(*) FROM subscriptions WHERE group_name = 'sintonia' AND current_period_start >= pm_start AND current_period_start < m_start AND status NOT IN ('incomplete','incomplete_expired')),

    'pulsar_renewing',   (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND COALESCE(group_name,'pulsar') = 'pulsar' AND cancel_at_period_end = false),
    'cuasar_renewing',   (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND group_name = 'cuasar' AND cancel_at_period_end = false),
    'sintonia_renewing', (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing') AND group_name = 'sintonia' AND cancel_at_period_end = false),

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
      FROM subscriptions s WHERE s.status IN ('active', 'trialing', 'past_due')
    ),

    -- ═══ CÓDICES: conteo + revenue real ═══
    -- v2 (2026-04-30) — Excluimos canjes con Cristal de Extracción
    -- en las 6 queries de purchases. Filtro: acquired_via = 'pago'.
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

    -- ═══ GASTOS OPERACIONALES (con billing info) ═══
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

    -- Mes actual (para cálculos de gastos anuales)
    'current_month', current_month

  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard(text)
    TO anon, authenticated, service_role;
