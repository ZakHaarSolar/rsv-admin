-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Patch del guard contra RSV 1:1 (v3 · enum cast)
-- 20260525_vtli_fix_guard_enum_cast.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Corrige el error 42883 "operator does not exist: slot_type_enum ~~ unknown".
-- El campo `asientos_reservados.slot_type` es un ENUM en RSV (no TEXT), por
-- eso `LIKE 'individual_%'` no compila sin un cast explícito.
--
-- Cambios respecto al patch 20260524:
--   · ar.slot_type → ar.slot_type::text  (para que LIKE funcione)
--   · r.status → r.status::text          (por si también es enum en RSV)
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

GRANT EXECUTE ON FUNCTION vtli_get_available_slots(INT) TO anon, authenticated;

-- FIN -------------------------------------------------------------------------
