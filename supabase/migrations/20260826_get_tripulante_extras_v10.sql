-- Red Solar Viva · get_tripulante_extras v10 — LA VERSIÓN DE LA APP VUELVE
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Por qué (2026-08-26, cazado por Zak: "estoy viendo otro y también dice
-- versión interna y no viene nada... yo mismo me meto y nada"): dos salas
-- numeraron "v9" en paralelo. La del 27 de junio sumó app_version +
-- app_version_updated_at; la del 23 de agosto (membresía por user_id/rc_)
-- se escribió desde la v8 y al reemplazar la función LOS DEJÓ FUERA. Desde
-- ese día la ficha del Motor dice "Sin reportar" para TODOS, con la columna
-- de profiles perfectamente poblada (verificado por agregado: 8 nodos en
-- 1.1.4, 7 en 1.1.3...). El reporte de la app nunca se rompió; se rompió la
-- lectura.
--
-- v10 = el cuerpo COMPLETO de la v9 del 23 (membresía por email + user_id +
-- rc_) + los dos campos de versión de vuelta. Nada más cambia.

DROP FUNCTION IF EXISTS get_tripulante_extras(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_tripulante_extras(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    is_subscriber                       BOOLEAN,
    tier                                TEXT,
    decoder_scans_used                  INT,
    dream_scans_used                    INT,
    last_complete_cycle_ts              TIMESTAMPTZ,
    email                               TEXT,
    purchases                           JSONB,
    subscription_started_at             TIMESTAMPTZ,
    subscription_current_period_end     TIMESTAMPTZ,
    subscription_cancel_at_period_end   BOOLEAN,
    subscription_is_gift                BOOLEAN,
    app_version                         TEXT,
    app_version_updated_at              TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_email TEXT;
    target_profile_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.email, p.id
      INTO target_email, target_profile_id
    FROM profiles p
    WHERE p.clerk_user_id = target_clerk_id
    LIMIT 1;

    RETURN QUERY
    WITH matching AS (
        SELECT s.*
        FROM subscriptions s
        WHERE s.status = 'active'
          AND (
              s.current_period_end IS NULL
              OR s.current_period_end > NOW()
          )
          AND (
              (
                  target_email IS NOT NULL
                  AND s.email IS NOT NULL
                  AND LOWER(TRIM(s.email)) = LOWER(TRIM(target_email))
              )
              OR (
                  target_profile_id IS NOT NULL
                  AND s.user_id IS NOT NULL
                  AND s.user_id = target_profile_id
              )
              OR s.stripe_customer_id = 'rc_' || target_clerk_id
          )
    ),
    active_sub AS (
        SELECT
            m.group_name,
            m.current_period_start,
            m.current_period_end,
            m.cancel_at_period_end,
            m.stripe_subscription_id
        FROM matching m
        ORDER BY
            CASE m.group_name
                WHEN 'inmersion' THEN 1
                WHEN 'pulsar'    THEN 2
                WHEN 'cuasar'    THEN 2
                WHEN 'sintonia'  THEN 3
                WHEN 'dream'     THEN 4
                WHEN 'decoder'   THEN 5
                ELSE 9
            END
        LIMIT 1
    )
    SELECT
        EXISTS(SELECT 1 FROM matching) AS is_subscriber,
        (SELECT group_name FROM active_sub) AS tier,
        (
            SELECT COUNT(*)::INT
            FROM decoder_scans ds
            WHERE ds.clerk_user_id = target_clerk_id
        ) AS decoder_scans_used,
        (
            SELECT COUNT(*)::INT
            FROM dream_scans dsk
            WHERE dsk.clerk_user_id = target_clerk_id
        ) AS dream_scans_used,
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
        ) AS subscription_is_gift,
        (SELECT p2.app_version FROM profiles p2
          WHERE p2.clerk_user_id = target_clerk_id LIMIT 1)
            AS app_version,
        (SELECT p2.app_version_updated_at FROM profiles p2
          WHERE p2.clerk_user_id = target_clerk_id LIMIT 1)
            AS app_version_updated_at;
END;
$$;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure::text AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'get_tripulante_extras'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', r.sig);
    END LOOP;
END $$;
