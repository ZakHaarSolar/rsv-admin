-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Fase 1: capacidad grupal reducida a 3 (de 22)
-- Fecha: 2026-04-22
--
-- Estamos abriendo la Cámara Solar por fases. Primera fase: 5 lugares
-- max por sesión. Diego ya tiene 2 exploradores comprometidos + 2
-- reservados vía el nuevo motor → quedan 3 cupos en pie.
--
-- Este script:
--   1. Actualiza los slots grupales ya sembrados a capacity=3.
--   2. Actualiza el default de seed_tuesday_slots para futuras semanas.
--
-- Si más adelante abrimos fase 2 (capacidad 10 o más), se corre un
-- nuevo script similar con el nuevo valor.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Slots existentes: bajar capacity a 3 para grupales futuros.
--    Solo afecta slots donde aún no se ha llenado; la constraint
--    slot_capacity_not_exceeded valida que confirmed+held ≤ capacity.
--    Si algún slot ya tiene más de 3 confirmadas, se preserva su capacity.
UPDATE public.asientos_reservados
SET
    capacity = GREATEST(confirmed_count + held_count, 3),
    updated_at = now()
WHERE slot_type IN ('grupal_pulsar', 'grupal_cuasar')
  AND start_time > now()
  AND capacity > 3;

-- 2. Re-crear seed_tuesday_slots con default 3 (antes 22).
CREATE OR REPLACE FUNCTION public.seed_tuesday_slots(
    p_weeks_ahead int DEFAULT 12,
    p_grupal_capacity int DEFAULT 3
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_first_tuesday date;
    v_d date;
    v_inserted int := 0;
BEGIN
    v_first_tuesday := v_today + ((2 - extract(dow FROM v_today)::int + 7) % 7);

    FOR i IN 0..(p_weeks_ahead - 1) LOOP
        v_d := v_first_tuesday + (i * 7);

        INSERT INTO public.asientos_reservados (slot_type, start_time, end_time, capacity)
        VALUES ('grupal_pulsar', (v_d || ' 17:30:00+00')::timestamptz, (v_d || ' 18:30:00+00')::timestamptz, p_grupal_capacity)
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        INSERT INTO public.asientos_reservados (slot_type, start_time, end_time, capacity)
        VALUES ('individual_60', (v_d || ' 15:00:00+00')::timestamptz, (v_d || ' 16:00:00+00')::timestamptz, 1)
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        INSERT INTO public.asientos_reservados (slot_type, start_time, end_time, capacity)
        VALUES ('individual_60', (v_d || ' 16:15:00+00')::timestamptz, (v_d || ' 17:15:00+00')::timestamptz, 1)
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        INSERT INTO public.asientos_reservados (slot_type, start_time, end_time, capacity)
        VALUES ('individual_60', (v_d || ' 20:00:00+00')::timestamptz, (v_d || ' 21:00:00+00')::timestamptz, 1)
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        INSERT INTO public.asientos_reservados (slot_type, start_time, end_time, capacity)
        VALUES ('individual_60', (v_d || ' 21:15:00+00')::timestamptz, (v_d || ' 22:15:00+00')::timestamptz, 1)
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        INSERT INTO public.asientos_reservados (slot_type, start_time, end_time, capacity)
        VALUES ('individual_60', (v_d || ' 22:30:00+00')::timestamptz, (v_d || ' 23:30:00+00')::timestamptz, 1)
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;
    END LOOP;

    RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_tuesday_slots FROM PUBLIC, anon, authenticated;

COMMIT;
