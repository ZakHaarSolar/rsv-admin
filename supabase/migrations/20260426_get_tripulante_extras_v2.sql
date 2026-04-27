-- Red Solar Viva · get_tripulante_extras v2 (suma email)
-- =====================================================================
-- v2 (2026-04-26): suma columna email al return para que el modal del
-- Motor lo muestre debajo del nombre. Cambiar el RETURNS TABLE requiere
-- DROP previo (CREATE OR REPLACE no permite mutar la signatura).
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

DROP FUNCTION IF EXISTS get_tripulante_extras(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_tripulante_extras(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    is_subscriber          BOOLEAN,
    tier                   TEXT,
    decoder_scans_used     INT,
    last_complete_cycle_ts TIMESTAMPTZ,
    email                  TEXT
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
    SELECT
        EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.email = target_email
              AND s.status = 'active'
        ) AS is_subscriber,

        (
            SELECT s.group_name
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
        ) AS tier,

        (
            SELECT COUNT(*)::INT
            FROM decoder_scans ds
            WHERE ds.clerk_user_id = target_clerk_id
        ) AS decoder_scans_used,

        (
            SELECT sv.created_at
            FROM scan_vibracional sv
            WHERE sv.clerk_user_id = target_clerk_id
              AND sv.cycle_scanned_json IS NOT NULL
              AND (
                  CASE
                      WHEN jsonb_typeof(sv.cycle_scanned_json) = 'array' THEN
                          jsonb_array_length(sv.cycle_scanned_json) = 6
                      ELSE FALSE
                  END
              )
            ORDER BY sv.created_at DESC
            LIMIT 1
        ) AS last_complete_cycle_ts,

        target_email AS email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tripulante_extras(TEXT, TEXT) TO anon, authenticated;
