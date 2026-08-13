-- Red Solar Viva · get_tripulante_extras v6 (guarda de period_end)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- v6 (2026-05-07): añade guarda de `current_period_end` al chequeo
-- `is_subscriber` y al CTE `active_sub`.
--
-- Por qué: si Stripe no llega a disparar el webhook
-- `customer.subscription.deleted` (failure de delivery, pausa de la
-- cuenta de Stripe, retry pendiente, etc.), la fila de la
-- subscripción puede quedarse con `status = 'active'` aunque el
-- ciclo ya terminó. Antes (v5) cualquier consumo de la RPC veía esa
-- fila como activa y al Tripulante seguía apareciéndole "Inmersión
-- Solar Activa" o "Sintonía Solar Activa" pasada la fecha real de
-- expiración.
--
-- La guarda `(s.current_period_end IS NULL OR s.current_period_end >
-- NOW())` resuelve eso desde el lado de lectura: aunque el webhook
-- nunca llegue, el sistema deja de tratar la fila como activa apenas
-- pasa la fecha de expiración. Si más adelante Stripe sí dispara el
-- delete (puede llegar tarde), el handler la marca `canceled` y todo
-- queda consistente.
--
-- Caso disparador: José Daniel (pedrazajosedaniel@hotmail.com).
-- current_period_end = 2026-05-01, status = 'active', cancel_at_period
-- _end = true. El día 7 de mayo seguía mostrando dorado en el panel
-- del Motor de Intervención. Con esta v6 deja de aparecer como
-- subscriber sin necesidad de tocar la fila a mano.
--
-- Para limpieza puntual de filas anteriores que sigan en limbo, se
-- puede correr el patch del final de este archivo (commented OUT
-- para que el run de la RPC no lo dispare por accidente).

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
          /* v6 — Guarda de expiración. NULL = subscripción sin
             ciclo aún (pre-billing); > NOW() = ciclo todavía
             vigente. Cualquier otra cosa = expirada. */
          AND (
              s.current_period_end IS NULL
              OR s.current_period_end > NOW()
          )
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
              AND (
                  s.current_period_end IS NULL
                  OR s.current_period_end > NOW()
              )
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

        /* Códices comprados (igual que v5). */
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

-- =====================================================================
-- Patch puntual para limpiar filas en limbo. Una sola pasada que
-- marca canceled cualquier subscripción `active` cuyo período ya
-- pasó. Se puede correr una vez para sincronizar el dataset y dejar
-- todo en su lugar; si Stripe envía el delete después, el handler la
-- vuelve a tocar idempotentemente (sigue siendo canceled).
-- =====================================================================
-- UPDATE subscriptions
--    SET status = 'canceled',
--        updated_at = NOW()
--  WHERE status = 'active'
--    AND current_period_end IS NOT NULL
--    AND current_period_end < NOW();
