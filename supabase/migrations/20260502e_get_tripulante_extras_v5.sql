-- Red Solar Viva · get_tripulante_extras v5 (fechas de suscripción)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- v5 (2026-05-02): suma cuatro campos al return para que el panel del
-- nodo del Motor de Intervención muestre el ciclo de la membresía:
--   · subscription_started_at         — cuándo empezó el ciclo actual
--   · subscription_current_period_end — cuándo termina el ciclo actual
--   · subscription_cancel_at_period_end — true si renovación desactivada
--                                         (cortesías y cancelaciones manuales)
--   · subscription_is_gift            — true si stripe_subscription_id
--                                         empieza con 'gift_' (cortesía
--                                         del admin)
-- Mantiene los seis campos previos (is_subscriber, tier,
-- decoder_scans_used, last_complete_cycle_ts, email, purchases) sin
-- cambio para no romper consumidores existentes.
--
-- Lectura del registro de suscripción: misma row que ya elige `tier`
-- (priorizando inmersion → cuasar/pulsar → sintonia, status='active'),
-- así los nuevos campos siempre describen la membresía vigente.

DROP FUNCTION IF EXISTS get_tripulante_extras(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_tripulante_extras(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    is_subscriber                       BOOLEAN,
    tier                                TEXT,
    decoder_scans_used                  INT,
    last_complete_cycle_ts              TIMESTAMPTZ,
    email                               TEXT,
    purchases                           JSONB,
    subscription_started_at             TIMESTAMPTZ,
    subscription_current_period_end     TIMESTAMPTZ,
    subscription_cancel_at_period_end   BOOLEAN,
    subscription_is_gift                BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_email TEXT;
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.email INTO target_email
    FROM profiles p
    WHERE p.clerk_user_id = target_clerk_id
    LIMIT 1;

    RETURN QUERY
    WITH active_sub AS (
        SELECT
            s.group_name,
            s.current_period_start,
            s.current_period_end,
            s.cancel_at_period_end,
            s.stripe_subscription_id
        FROM subscriptions s
        WHERE s.email = target_email
          AND s.status = 'active'
        ORDER BY
            CASE s.group_name
                WHEN 'inmersion' THEN 1
                WHEN 'pulsar'    THEN 2
                WHEN 'cuasar'    THEN 2
                WHEN 'sintonia'  THEN 3
                ELSE 9
            END
        LIMIT 1
    )
    SELECT
        EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.email = target_email
              AND s.status = 'active'
        ) AS is_subscriber,

        (SELECT group_name FROM active_sub) AS tier,

        (
            SELECT COUNT(*)::INT
            FROM decoder_scans ds
            WHERE ds.clerk_user_id = target_clerk_id
        ) AS decoder_scans_used,

        /* Último ciclo COMPLETO — comas en TEXT. 6 pilares = 5 comas. */
        (
            SELECT sv.created_at
            FROM scan_vibracional sv
            WHERE sv.clerk_user_id = target_clerk_id
              AND sv.cycle_scanned_json IS NOT NULL
              AND sv.cycle_scanned_json::TEXT <> ''
              AND (
                  LENGTH(sv.cycle_scanned_json::TEXT)
                  - LENGTH(REPLACE(sv.cycle_scanned_json::TEXT, ',', ''))
              ) = 5
            ORDER BY sv.created_at DESC
            LIMIT 1
        ) AS last_complete_cycle_ts,

        target_email AS email,

        /* Códices comprados (igual que v4). */
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'book_id', p.book_id,
                        'title', COALESCE(b.title, 'Códice'),
                        'device', p.acquired_device,
                        'formats', p.formats_purchased,
                        'purchased_at', p.purchased_at,
                        'amount_cents', p.amount_cents
                    )
                    ORDER BY p.purchased_at DESC
                )
                FROM purchases p
                LEFT JOIN books b ON b.id = p.book_id
                WHERE (
                    target_email IS NOT NULL
                    AND LOWER(TRIM(p.email)) = LOWER(TRIM(target_email))
                )
                AND COALESCE(p.acquired_via, 'pago') = 'pago'
            ),
            '[]'::jsonb
        ) AS purchases,

        /* v5 — Fechas y flags del ciclo de la membresía vigente. */
        (SELECT current_period_start FROM active_sub)
            AS subscription_started_at,
        (SELECT current_period_end FROM active_sub)
            AS subscription_current_period_end,
        COALESCE(
            (SELECT cancel_at_period_end FROM active_sub),
            false
        ) AS subscription_cancel_at_period_end,
        COALESCE(
            (
                SELECT stripe_subscription_id LIKE 'gift_%'
                FROM active_sub
            ),
            false
        ) AS subscription_is_gift;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tripulante_extras(TEXT, TEXT)
    TO anon, authenticated;
