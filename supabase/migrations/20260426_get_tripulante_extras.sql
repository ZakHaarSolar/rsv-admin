-- Red Solar Viva · get_tripulante_extras (Motor de Intervención)
-- =====================================================================
-- Objetivo: enriquecer el modal de tripulante en el Motor con info que
-- el RPC `get_tripulantes_scan_activity` actual no devuelve:
--
--   1. is_subscriber  → ¿tiene Sintonía Solar (o cualquier suscripción)
--                       activa?
--   2. tier            → "sintonia" / "inmersion" / NULL.
--   3. decoder_scans_used → cuántos disparos del Decodificador de Materia
--                           ha hecho (para mostrar X/3 si no es suscriber).
--   4. last_complete_cycle_ts → timestamp del último ciclo COMPLETO
--                               (cycle_scanned_json con 6 pilares). Si nunca
--                               cerró un ciclo, NULL → la UI muestra "—".
--                               Diego reportó que el "Último 26-abr"
--                               aparecía aunque solo había 1 pilar
--                               escaneado — la UI usaba last_scan_ts
--                               (cualquier scan), no el último ciclo
--                               cerrado. Este RPC ya filtra por 6/6.
--
-- Patrón canónico: SECURITY DEFINER + admin_clerk_id explícito gated por
-- profiles.is_admin (igual que get_decoder_scans_total y compañía).

CREATE OR REPLACE FUNCTION get_tripulante_extras(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    is_subscriber          BOOLEAN,
    tier                   TEXT,
    decoder_scans_used     INT,
    last_complete_cycle_ts TIMESTAMPTZ
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

    /* Email del tripulante (necesario para joinear con subscriptions,
       que vive por email — no por clerk_user_id). */
    SELECT email INTO target_email
    FROM profiles
    WHERE clerk_user_id = target_clerk_id
    LIMIT 1;

    RETURN QUERY
    SELECT
        /* ── Suscripción activa ── */
        EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.email = target_email
              AND s.status = 'active'
        ) AS is_subscriber,

        /* Tier: si tiene suscripción activa, devolvemos su group_name.
           NULL si no tiene. Si tiene varias activas (no debería),
           prefiere "inmersion" sobre "sintonia". */
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

        /* ── Disparos del Decodificador ── */
        (
            SELECT COUNT(*)::INT
            FROM decoder_scans ds
            WHERE ds.clerk_user_id = target_clerk_id
        ) AS decoder_scans_used,

        /* ── Último ciclo COMPLETO ──
           Filtramos por scans cuyo cycle_scanned_json tenga 6 elementos.
           Manejamos los 3 formatos en los que vive ese campo en la DB:
           array nativo, string JSON, NULL. Tomamos el created_at del
           más reciente. */
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
        ) AS last_complete_cycle_ts;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tripulante_extras(TEXT, TEXT) TO anon, authenticated;
