-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Seed slots individual_30 + individual_45
-- Fecha: 2026-04-22
--
-- Los tripulantes veían el modal 1:1 de 30 min y 45 min vacío porque
-- la seed inicial sólo sembró `individual_60`. Este script:
--   1. Reemplaza `seed_tuesday_slots` para sembrar los 3 tipos con los
--      mismos 5 start_times por martes, ajustando end_time por duración.
--   2. Hace un seed inmediato de 12 martes adelante (idempotente vía
--      UNIQUE constraint slot_type+start_time).
--
-- Horarios (hora Cancún):
--   10:00 AM (15:00 UTC), 11:15 AM (16:15 UTC), 3:00 PM (20:00 UTC),
--   4:15 PM (21:15 UTC), 5:30 PM (22:30 UTC).
--
-- NOTA IMPORTANTE DE DOBLE-BOOKING:
--   Los 3 tipos comparten los mismos start_times. Si un tripulante
--   reserva individual_60 a las 10:00, el slot individual_30 y
--   individual_45 a las 10:00 siguen apareciendo DISPONIBLES en la UI —
--   la base no sabe que Zak ya está comprometido en ese start_time.
--   Solución futura: agregar un trigger que cierre (is_open=false) los
--   otros slots del mismo start_time cuando se confirma uno. Por ahora
--   Diego administra manualmente (cerrar slots restantes en el dashboard
--   tras cada reserva 1:1).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    -- 5 start_times UTC correspondientes a 10:00, 11:15, 15:00, 16:15, 17:30 Cancún
    v_starts time[] := ARRAY['15:00', '16:15', '20:00', '21:15', '22:30']::time[];
    v_start time;
BEGIN
    v_first_tuesday := v_today + ((2 - extract(dow FROM v_today)::int + 7) % 7);

    FOR i IN 0..(p_weeks_ahead - 1) LOOP
        v_d := v_first_tuesday + (i * 7);

        -- Grupal Púlsar 12:30 PM Cancún (17:30 UTC) → 1:30 PM (18:30 UTC) · 60 min
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

        -- Individuales: 30, 45, 60 min por cada start_time
        FOREACH v_start IN ARRAY v_starts LOOP
            -- individual_30 (30 min = +00:30)
            INSERT INTO public.asientos_reservados
                (slot_type, start_time, end_time, capacity)
            VALUES (
                'individual_30',
                (v_d::text || ' ' || v_start::text || '+00')::timestamptz,
                (v_d::text || ' ' || v_start::text || '+00')::timestamptz + interval '30 minutes',
                1
            )
            ON CONFLICT (slot_type, start_time) DO NOTHING;
            IF FOUND THEN v_inserted := v_inserted + 1; END IF;

            -- individual_45 (45 min = +00:45)
            INSERT INTO public.asientos_reservados
                (slot_type, start_time, end_time, capacity)
            VALUES (
                'individual_45',
                (v_d::text || ' ' || v_start::text || '+00')::timestamptz,
                (v_d::text || ' ' || v_start::text || '+00')::timestamptz + interval '45 minutes',
                1
            )
            ON CONFLICT (slot_type, start_time) DO NOTHING;
            IF FOUND THEN v_inserted := v_inserted + 1; END IF;

            -- individual_60 (60 min = +01:00)
            INSERT INTO public.asientos_reservados
                (slot_type, start_time, end_time, capacity)
            VALUES (
                'individual_60',
                (v_d::text || ' ' || v_start::text || '+00')::timestamptz,
                (v_d::text || ' ' || v_start::text || '+00')::timestamptz + interval '60 minutes',
                1
            )
            ON CONFLICT (slot_type, start_time) DO NOTHING;
            IF FOUND THEN v_inserted := v_inserted + 1; END IF;
        END LOOP;
    END LOOP;

    RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_tuesday_slots FROM PUBLIC, anon, authenticated;

-- Ejecutar seed inmediato (idempotente)
SELECT public.seed_tuesday_slots(12);

COMMIT;
