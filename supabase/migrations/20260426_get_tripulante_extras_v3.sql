-- Red Solar Viva · get_tripulante_extras v3 (fix runtime + email)
-- =====================================================================
-- v3 (2026-04-26): el RPC v1/v2 crasheaba en runtime con
--   ERROR 42883: function jsonb_typeof(text) does not exist
-- porque scan_vibracional.cycle_scanned_json es TEXT, no JSONB. El
-- error no se veía hasta que se llamaba al RPC desde el modal del
-- Motor — Postgres compila la función pero el cast falla en
-- ejecución cuando hay datos.
--
-- Side effect del crash: el frontend recibía 500/null, extras quedaba
-- null y el modal caía a defaults (decoder_scans_used = 0 → "3/3
-- restantes" aunque la tabla decoder_scans tuviera 3 rows reales,
-- email "—", próximo ciclo "—").
--
-- Fix: contar comas en el TEXT directo. Un ciclo de 6 pilares es un
-- JSON-array string como '["fisico","mental","emocional","financiero",
-- "vector","orbita"]' — exactamente 5 comas. Sin parseo JSON, sin
-- type cast, sin posibilidad de error en runtime.
--
-- También suma email al return (lo que v2 quería hacer).
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

        /* Último ciclo COMPLETO — contamos comas en el TEXT en lugar
           de parsear JSONB. 6 pilares = 5 comas exactas, formato fijo
           '["fisico","mental","emocional","financiero","vector","orbita"]'.
           Sin cast, sin posibilidad de error en runtime, agnóstico al
           tipo real de la columna (text/varchar/jsonb). */
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

        target_email AS email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tripulante_extras(TEXT, TEXT) TO anon, authenticated;
