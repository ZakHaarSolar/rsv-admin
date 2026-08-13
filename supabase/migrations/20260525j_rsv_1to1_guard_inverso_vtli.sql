-- ═══════════════════════════════════════════════════════════════════════════
-- RSV · Guard inverso para Cámara de Resonancia 1:1
-- 20260525j_rsv_1to1_guard_inverso_vtli.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Contexto:
--   Ya existe el guard directo `VTLI → bloquea martes con sesión 1:1 RSV
--   confirmada` dentro de vtli_get_available_slots. Falta el guard inverso:
--   `RSV 1:1 → oculta martes con reserva VTLI confirmada`.
--
--   Caso visible: END to END agendó VTLI Telekinesis martes 26 may 5pm
--   presencial Cancún, pero el calendario de Cámara de Resonancia 1:1 en
--   redsolarviva.com/sesiones sigue mostrando ese martes con 5 horarios
--   abiertos (10am, 11:15am, 3pm, 4:15pm, 5:30pm). Conflicto: Zak'Haar no
--   puede sostener sesión Zoom 1:1 mientras está en cámara presencial.
--
-- Cambios:
--   Re-define `public.get_available_slots` (la RPC que `useSolarBooking.tsx`
--   consume) agregando NOT EXISTS contra vtli_reservas. Si el slot es de
--   tipo individual_* Y cae en martes Y hay al menos una reserva VTLI
--   confirmada ese mismo día → se oculta el slot completo.
--
--   Approach conservador: bloquea TODO el martes (cualquier hora del 1:1)
--   cuando hay VTLI confirmada ese día. Sin granularidad por bandas
--   horarias porque la VTLI presencial requiere preparación y bajada.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_slot_type slot_type_enum,
    p_from      timestamptz DEFAULT now(),
    p_to        timestamptz DEFAULT (now() + interval '90 days')
)
RETURNS TABLE (
    id              uuid,
    slot_type       slot_type_enum,
    start_time      timestamptz,
    end_time        timestamptz,
    capacity        int,
    confirmed_count int,
    held_count      int,
    available       int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        a.id,
        a.slot_type,
        a.start_time,
        a.end_time,
        a.capacity,
        a.confirmed_count,
        a.held_count,
        GREATEST(a.capacity - a.confirmed_count - a.held_count, 0) AS available
    FROM public.asientos_reservados a
    WHERE a.slot_type = p_slot_type
      AND a.start_time >= p_from
      AND a.start_time <= p_to
      AND a.is_open = true
      -- Guard inverso: si es Cámara de Resonancia 1:1, oculta los MARTES
      -- con reserva VTLI confirmada. Zak no puede atender Zoom 1:1 + VTLI
      -- presencial el mismo día.
      AND NOT (
          a.slot_type::text LIKE 'individual_%'
          AND EXTRACT(ISODOW FROM (a.start_time AT TIME ZONE 'America/Cancun')) = 2
          AND EXISTS (
              SELECT 1
              FROM vtli_reservas vr
              JOIN vtli_slots vs ON vs.id = vr.slot_id
              WHERE vr.status = 'confirmada'
                AND vs.slot_date = (a.start_time AT TIME ZONE 'America/Cancun')::date
          )
      )
    ORDER BY a.start_time ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(slot_type_enum, timestamptz, timestamptz)
    TO anon, authenticated, service_role;

-- Verificación: ver qué martes futuros tienen VTLI confirmada
SELECT vs.slot_date,
       COUNT(*) AS reservas_vtli_confirmadas
FROM vtli_reservas vr
JOIN vtli_slots vs ON vs.id = vr.slot_id
WHERE vr.status = 'confirmada'
  AND vs.slot_date >= CURRENT_DATE
  AND EXTRACT(ISODOW FROM vs.slot_date) = 2  -- martes
GROUP BY vs.slot_date
ORDER BY vs.slot_date;

-- FIN ─────────────────────────────────────────────────────────────────────────
