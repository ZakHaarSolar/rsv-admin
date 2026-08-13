-- ═══════════════════════════════════════════════════════════════════════════
-- VTLI · Reserva con 1 día de anticipación mínimo
-- 20260525l_vtli_anticipacion_1_dia.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cambio:
--   Re-define `vtli_get_available_slots` agregando filtro
--   `slot_date > CURRENT_DATE` (en zona Cancún). Esto bloquea el día actual:
--   solo aparecen slots a partir del día siguiente.
--
--   Caso: hoy es viernes 23 may. Antes de este patch el Tutor podía ver
--   slots del propio sábado/domingo (no hay seeds para esos días pero la
--   regla aplica al mismo día). Con este patch: si hoy es lunes, los slots
--   de hoy quedan ocultos — solo se ven martes en adelante.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION vtli_get_available_slots(p_weeks_ahead INT DEFAULT 2)
RETURNS TABLE (
    slot_id    UUID,
    slot_date  DATE,
    slot_time  TIME,
    available  INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Auto-expire inline de holds vencidos (sin cron externo).
    UPDATE vtli_reservas
        SET status = 'expirada'
        WHERE status = 'pendiente'
          AND expires_at IS NOT NULL
          AND expires_at < NOW();

    RETURN QUERY
    SELECT
        s.id,
        s.slot_date,
        s.slot_time,
        (s.capacity - s.reserved_count)::INT
    FROM vtli_slots s
    WHERE
      -- Cambio principal: > (estricto), no >=. Bloquea el mismo día.
      -- CURRENT_DATE evalúa la fecha actual en zona del server (UTC).
      -- Convertimos a Cancún para evitar el caso "es noche en UTC pero
      -- aún es día activo en Cancún (Cancún = UTC-5)".
      s.slot_date > (NOW() AT TIME ZONE 'America/Cancun')::date
      AND s.slot_date <= (NOW() AT TIME ZONE 'America/Cancun')::date + (p_weeks_ahead * 7)
      AND s.reserved_count < s.capacity
      -- Guard contra martes RSV 1:1: ocultar martes con sesión 1:1 RSV
      -- confirmada el mismo día y hora.
      AND NOT (
          EXTRACT(ISODOW FROM s.slot_date) = 2
          AND EXISTS (
              SELECT 1
              FROM reservas r
              JOIN asientos_reservados ar ON ar.id = r.asiento_id
              WHERE ar.slot_type::text LIKE 'individual_%'
                AND r.status::text IN ('confirmada', 'pendiente')
                AND (ar.start_time AT TIME ZONE 'America/Cancun')::date = s.slot_date
                AND (ar.start_time AT TIME ZONE 'America/Cancun')::time = s.slot_time
          )
      )
    ORDER BY s.slot_date, s.slot_time;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_get_available_slots(INT) TO anon, authenticated, service_role;

-- Verificación: listar fechas más tempranas que la RPC permite hoy
SELECT MIN(slot_date) AS primer_dia_disponible,
       MAX(slot_date) AS ultimo_dia_disponible,
       COUNT(*) AS total_slots
FROM vtli_get_available_slots(8);

-- FIN ─────────────────────────────────────────────────────────────────────────
