-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Fix: Cámara Solar grupal dura 60 min, no 90
-- Fecha: 2026-04-22
--
-- El seed_tuesday_slots original creaba slots grupales con end_time
-- 90 min después del start (17:30 UTC → 19:00 UTC = 12:30 PM → 2:00 PM
-- Cancún). El valor correcto son 60 min (12:30 PM → 1:30 PM).
--
-- Este script:
--   1. Actualiza los slots grupales YA sembrados (end_time - 30 min).
--   2. Reemplaza la función seed_tuesday_slots con el end_time correcto.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Fix slots existentes: end_time = start_time + 60 min (antes 90).
UPDATE public.asientos_reservados
SET
    end_time = start_time + interval '60 minutes',
    updated_at = now()
WHERE slot_type IN ('grupal_pulsar', 'grupal_cuasar')
  AND end_time = start_time + interval '90 minutes';

-- 2. Recrear seed_tuesday_slots con duración correcta.
CREATE OR REPLACE FUNCTION public.seed_tuesday_slots(
    p_weeks_ahead int DEFAULT 12,
    p_grupal_capacity int DEFAULT 22
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

        -- Grupal Púlsar: 12:30 PM Cancún (17:30 UTC) → 1:30 PM Cancún (18:30 UTC). 60 min.
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'grupal_pulsar',
            (v_d || ' 17:30:00+00')::timestamptz,
            (v_d || ' 18:30:00+00')::timestamptz,
            p_grupal_capacity
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        -- Individuales 60 min (sin cambios — ya eran 60).
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
