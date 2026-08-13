-- ═══════════════════════════════════════════════════════════════════════════
-- RSV · Guard inverso GRANULAR (ventana ±90 min) v2
-- 20260525k_rsv_guard_inverso_granular.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Reemplaza la versión `j` que bloqueaba el martes entero. Ahora oculta solo
-- los slots 1:1 RSV cuya hora esté DENTRO de ±90 min del slot VTLI confirmado
-- ese mismo día. Permite mantener mañana / tarde temprano disponibles cuando
-- la VTLI está al final del día (caso END to END VTLI 17:00 → bloquea solo
-- 15:30 a 18:30 RSV; los slots 10:00, 11:15, 15:00 quedan visibles).
--
-- Lógica de ventana:
--   ABS(epoch_diff_segundos) ≤ 5400  (90 min × 60 seg)
--   donde epoch_diff = start_time_rsv_local - (vtli_slot_date + vtli_slot_time)
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
      -- Guard inverso granular: oculta slots 1:1 RSV solo si caen dentro de
      -- ±90 min de un slot VTLI confirmado el mismo día (hora local Cancún).
      AND NOT (
          a.slot_type::text LIKE 'individual_%'
          AND EXISTS (
              SELECT 1
              FROM vtli_reservas vr
              JOIN vtli_slots vs ON vs.id = vr.slot_id
              WHERE vr.status = 'confirmada'
                AND vs.slot_date = (a.start_time AT TIME ZONE 'America/Cancun')::date
                AND ABS(
                    EXTRACT(EPOCH FROM (
                        (a.start_time AT TIME ZONE 'America/Cancun')::timestamp
                        - (vs.slot_date + vs.slot_time)
                    ))
                ) <= 5400  -- 90 min × 60 seg
          )
      )
    ORDER BY a.start_time ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(slot_type_enum, timestamptz, timestamptz)
    TO anon, authenticated, service_role;

-- Verificación: para cada martes con VTLI confirmada, listar qué slots RSV
-- quedan bloqueados por la ventana de ±90 min.
SELECT vs.slot_date AS dia_vtli,
       vs.slot_time AS hora_vtli,
       a.start_time AS rsv_start_time,
       a.slot_type::text AS rsv_tipo,
       ABS(EXTRACT(EPOCH FROM (
           (a.start_time AT TIME ZONE 'America/Cancun')::timestamp
           - (vs.slot_date + vs.slot_time)
       ))) / 60 AS diff_minutos
FROM vtli_reservas vr
JOIN vtli_slots vs ON vs.id = vr.slot_id
JOIN public.asientos_reservados a
  ON (a.start_time AT TIME ZONE 'America/Cancun')::date = vs.slot_date
WHERE vr.status = 'confirmada'
  AND a.slot_type::text LIKE 'individual_%'
  AND a.is_open = true
  AND a.start_time >= NOW()
  AND ABS(EXTRACT(EPOCH FROM (
      (a.start_time AT TIME ZONE 'America/Cancun')::timestamp
      - (vs.slot_date + vs.slot_time)
  ))) <= 5400
ORDER BY vs.slot_date, a.start_time;

-- FIN ─────────────────────────────────────────────────────────────────────────
