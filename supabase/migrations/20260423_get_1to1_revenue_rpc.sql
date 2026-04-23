-- Red Solar Viva — get_1to1_revenue_summary RPC (v1)
-- ───────────────────────────────────────────────────────────────────
-- Telemetría del Núcleo necesita leer `reservas` (1:1) para mostrar la
-- nueva fila "◈ Transmisión 1:1" con ingresos del mes + desglose por
-- duración. Pero la tabla tiene RLS activo SIN policies (migración
-- 20260422_booking_engine.sql líneas 498-501: "Sin policies = sin
-- acceso directo. Todo va por RPCs SECURITY DEFINER."), así que el
-- fetch desde el browser con anon key devuelve silenciosamente array
-- vacío. Sin esta RPC, los $10 MXN de las pruebas 1:1 confirmadas por
-- el Stripe webhook JAMÁS aparecerán en el panel.
--
-- SECURITY DEFINER ejecuta con los privilegios del owner → bypassa
-- RLS. El admin gate (profiles.is_admin) valida que sólo el Arquitecto
-- pueda leer estos agregados.
--
-- Devuelve jsonb con dos buckets (this_month, prev_month). Cada bucket
-- respeta el shape que consume useOneToOneSessions en TelemetriaDelNucleo:
--   { total_30: {count, revenueCents},
--     total_45: {count, revenueCents},
--     total_60: {count, revenueCents},
--     totalCount, totalRevenueCents }
--
-- Deploy manual:
--   cd /Users/diego/Documents/Red\ Solar\ Viva/admin
--   supabase db push
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_1to1_revenue_summary(
    p_clerk_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin boolean;
    v_this_start timestamptz;
    v_next_start timestamptz;
    v_prev_start timestamptz;
    v_this jsonb;
    v_prev jsonb;
BEGIN
    -- Validar admin
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not authorized — admin required'
            USING ERRCODE = '42501';
    END IF;

    -- Ventanas UTC: mes en curso + mes anterior
    v_this_start := date_trunc('month', now() AT TIME ZONE 'UTC')
                    AT TIME ZONE 'UTC';
    v_next_start := v_this_start + interval '1 month';
    v_prev_start := v_this_start - interval '1 month';

    -- This month
    SELECT jsonb_build_object(
        'total_30', jsonb_build_object(
            'count', COUNT(*) FILTER (WHERE a.slot_type = 'individual_30'),
            'revenueCents', COALESCE(
                SUM(r.amount_mxn_cents) FILTER (WHERE a.slot_type = 'individual_30'),
                0
            )
        ),
        'total_45', jsonb_build_object(
            'count', COUNT(*) FILTER (WHERE a.slot_type = 'individual_45'),
            'revenueCents', COALESCE(
                SUM(r.amount_mxn_cents) FILTER (WHERE a.slot_type = 'individual_45'),
                0
            )
        ),
        'total_60', jsonb_build_object(
            'count', COUNT(*) FILTER (WHERE a.slot_type = 'individual_60'),
            'revenueCents', COALESCE(
                SUM(r.amount_mxn_cents) FILTER (WHERE a.slot_type = 'individual_60'),
                0
            )
        ),
        'totalCount', COUNT(*),
        'totalRevenueCents', COALESCE(SUM(r.amount_mxn_cents), 0)
    ) INTO v_this
    FROM public.reservas r
    JOIN public.asientos_reservados a ON a.id = r.asiento_id
    WHERE r.status = 'confirmada'
      AND r.confirmed_at >= v_this_start
      AND r.confirmed_at <  v_next_start
      AND a.slot_type IN ('individual_30', 'individual_45', 'individual_60');

    -- Prev month
    SELECT jsonb_build_object(
        'total_30', jsonb_build_object(
            'count', COUNT(*) FILTER (WHERE a.slot_type = 'individual_30'),
            'revenueCents', COALESCE(
                SUM(r.amount_mxn_cents) FILTER (WHERE a.slot_type = 'individual_30'),
                0
            )
        ),
        'total_45', jsonb_build_object(
            'count', COUNT(*) FILTER (WHERE a.slot_type = 'individual_45'),
            'revenueCents', COALESCE(
                SUM(r.amount_mxn_cents) FILTER (WHERE a.slot_type = 'individual_45'),
                0
            )
        ),
        'total_60', jsonb_build_object(
            'count', COUNT(*) FILTER (WHERE a.slot_type = 'individual_60'),
            'revenueCents', COALESCE(
                SUM(r.amount_mxn_cents) FILTER (WHERE a.slot_type = 'individual_60'),
                0
            )
        ),
        'totalCount', COUNT(*),
        'totalRevenueCents', COALESCE(SUM(r.amount_mxn_cents), 0)
    ) INTO v_prev
    FROM public.reservas r
    JOIN public.asientos_reservados a ON a.id = r.asiento_id
    WHERE r.status = 'confirmada'
      AND r.confirmed_at >= v_prev_start
      AND r.confirmed_at <  v_this_start
      AND a.slot_type IN ('individual_30', 'individual_45', 'individual_60');

    RETURN jsonb_build_object(
        'this_month', v_this,
        'prev_month', v_prev
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_1to1_revenue_summary(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_1to1_revenue_summary(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_1to1_revenue_summary(text) TO authenticated;
