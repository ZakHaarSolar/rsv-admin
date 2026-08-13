-- 20260501_revenue_exclusions.sql
-- Tabla `revenue_exclusions` para excluir suscripciones específicas
-- del cómputo de ingresos en Telemetría del Núcleo SIN marcar al
-- usuario como admin. Útil para cuentas de prueba propias (con
-- código de descuento al 100%) que no se deben contar como MRR.
--
-- Cómo agregar una exclusión:
--   INSERT INTO public.revenue_exclusions (email, reason)
--   VALUES ('cuenta@ejemplo.com', 'Cuenta de prueba');
--
-- Cómo quitar:
--   DELETE FROM public.revenue_exclusions WHERE email = 'cuenta@ejemplo.com';

CREATE TABLE IF NOT EXISTS public.revenue_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.revenue_exclusions ENABLE ROW LEVEL SECURITY;
-- Sin policies: tabla cerrada por default. La función SECURITY DEFINER
-- de get_admin_dashboard la lee bypaseando RLS.

-- Seed inicial: cuenta de prueba de Zak
INSERT INTO public.revenue_exclusions (email, reason)
VALUES ('cuerpodeluz555@gmail.com', 'Cuenta de prueba personal de Zak')
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- Patch de `get_admin_dashboard`: el filtro pasa de
-- "excluir admins" a "excluir emails que estén en revenue_exclusions".
-- Match por LOWER(TRIM()) para tolerar variaciones.
-- ─────────────────────────────────────────────────────────────────

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
    'pulsar_active',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND COALESCE(s.group_name,'pulsar') = 'pulsar' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_active',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'cuasar' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_active', (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'sintonia' AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    'pulsar_rev_this',   (SELECT count(*) FROM subscriptions s WHERE COALESCE(s.group_name,'pulsar') = 'pulsar' AND s.current_period_start >= m_start AND s.current_period_start < m_end AND s.status NOT IN ('incomplete','incomplete_expired') AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_rev_this',   (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'cuasar' AND s.current_period_start >= m_start AND s.current_period_start < m_end AND s.status NOT IN ('incomplete','incomplete_expired') AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_rev_this', (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'sintonia' AND s.current_period_start >= m_start AND s.current_period_start < m_end AND s.status NOT IN ('incomplete','incomplete_expired') AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    'pulsar_rev_prev',   (SELECT count(*) FROM subscriptions s WHERE COALESCE(s.group_name,'pulsar') = 'pulsar' AND s.current_period_start >= pm_start AND s.current_period_start < m_start AND s.status NOT IN ('incomplete','incomplete_expired') AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_rev_prev',   (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'cuasar' AND s.current_period_start >= pm_start AND s.current_period_start < m_start AND s.status NOT IN ('incomplete','incomplete_expired') AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_rev_prev', (SELECT count(*) FROM subscriptions s WHERE s.group_name = 'sintonia' AND s.current_period_start >= pm_start AND s.current_period_start < m_start AND s.status NOT IN ('incomplete','incomplete_expired') AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

    'pulsar_renewing',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND COALESCE(s.group_name,'pulsar') = 'pulsar' AND s.cancel_at_period_end = false AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'cuasar_renewing',   (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'cuasar' AND s.cancel_at_period_end = false AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),
    'sintonia_renewing', (SELECT count(*) FROM subscriptions s WHERE s.status IN ('active','trialing') AND s.group_name = 'sintonia' AND s.cancel_at_period_end = false AND NOT EXISTS (SELECT 1 FROM revenue_exclusions e WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(s.email)))),

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
