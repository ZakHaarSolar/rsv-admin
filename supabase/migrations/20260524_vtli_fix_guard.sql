-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Patch del guard contra RSV 1:1
-- 20260524_vtli_fix_guard.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Reemplaza el RPC `vtli_get_available_slots` con la versión que usa los
-- nombres REALES del schema RSV:
--   · reservas.asiento_id            (no slot_id)
--   · asientos_reservados.start_time (TIMESTAMPTZ, no slot_date + slot_time)
--   · asientos_reservados.slot_type
--
-- La conversión a fecha/hora local se hace con `AT TIME ZONE 'America/Cancun'`
-- (Cancún es UTC-5 sin horario de verano). Si en el futuro alguna sesión RSV
-- se agenda desde otra zona, el match sigue siendo correcto porque el slot
-- VTLI también está expresado en hora Cancún.
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
    RETURN QUERY
    SELECT
        s.id,
        s.slot_date,
        s.slot_time,
        (s.capacity - s.reserved_count)::INT
    FROM vtli_slots s
    WHERE s.slot_date >= CURRENT_DATE
      AND s.slot_date <= CURRENT_DATE + (p_weeks_ahead * 7)
      AND s.reserved_count < s.capacity
      -- Guard contra martes RSV 1:1: si es martes Y existe una sesión 1:1
      -- de Red Solar Viva (slot_type LIKE 'individual_%') confirmada o
      -- pendiente cuyo start_time (zona Cancún) coincide con s.slot_date +
      -- s.slot_time, este slot VTLI se oculta.
      AND NOT (
          EXTRACT(ISODOW FROM s.slot_date) = 2
          AND EXISTS (
              SELECT 1
              FROM reservas r
              JOIN asientos_reservados ar ON ar.id = r.asiento_id
              WHERE ar.slot_type LIKE 'individual_%'
                AND r.status IN ('confirmada', 'pendiente')
                AND (ar.start_time AT TIME ZONE 'America/Cancun')::date = s.slot_date
                AND (ar.start_time AT TIME ZONE 'America/Cancun')::time = s.slot_time
          )
      )
    ORDER BY s.slot_date, s.slot_time;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_get_available_slots(INT) TO anon, authenticated;

-- FIN -------------------------------------------------------------------------
