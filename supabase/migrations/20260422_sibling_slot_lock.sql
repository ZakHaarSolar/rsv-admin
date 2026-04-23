-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Mutual exclusion de slots individuales hermanos
-- Fecha: 2026-04-22 (v2 — fix operator error con slot_type_enum)
--
-- Contexto: cada martes sembramos individual_30, individual_45 e
-- individual_60 compartiendo los mismos 5 start_times. Si un tripulante
-- reserva el de 60 min a las 10:00, los slots de 30 y 45 min a las 10:00
-- seguirían apareciendo disponibles (Zak puede con solo 1 sesión a esa
-- hora, no 3). Este trigger resuelve la exclusión:
--
--   · INSERT/UPDATE/DELETE en `reservas` para slots individual_* →
--     recomputa `is_open` para TODOS los asientos individual_X que
--     compartan start_time con el asiento afectado.
--   · Si hay cualquier reserva en estado 'pendiente' (con hold vigente)
--     o 'confirmada' en el start_time → TODOS los hermanos cierran
--     (is_open = false).
--   · Si ninguna reserva activa en el start_time → TODOS los hermanos
--     reabren (is_open = true).
--
-- v2 2026-04-22 — slot_type es enum (slot_type_enum), LIKE no funciona
-- sobre enums → reemplazamos por IN ('individual_30','individual_45',
-- 'individual_60'). Más explícito y eficiente.
--
-- Interacción con release_expired_holds:
--   · El cron pone status='expirada'. Eso dispara el trigger en UPDATE
--     → recomputa → hermanos reabren automático. No hace falta cambios
--     al cron.
--
-- ⚠️ CAVEAT de cierre MANUAL por admin:
--   Si Diego pone is_open=false MANUALMENTE en un slot (ej. porque Zak
--   se enferma un martes), este trigger NO lo respeta — al siguiente
--   evento de reservas en ese start_time, reabre todo basado en data
--   de reservas. Para cierres manuales, la recomendación actual es
--   eliminar los asientos (DELETE FROM asientos_reservados WHERE ...).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public._reservas_sync_sibling_slots()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_asiento_id uuid;
    v_start_time timestamptz;
    v_is_individual boolean;
    v_any_active boolean;
BEGIN
    v_asiento_id := COALESCE(NEW.asiento_id, OLD.asiento_id);

    -- Obtener start_time + validar que el asiento sea individual_*
    SELECT
        a.start_time,
        a.slot_type IN (
            'individual_30'::slot_type_enum,
            'individual_45'::slot_type_enum,
            'individual_60'::slot_type_enum
        )
    INTO v_start_time, v_is_individual
    FROM public.asientos_reservados a
    WHERE a.id = v_asiento_id;

    -- Si no es individual (grupal) no hacemos mutex.
    IF NOT COALESCE(v_is_individual, false) THEN
        RETURN NULL;
    END IF;

    -- ¿Hay alguna reserva activa en este start_time?
    SELECT EXISTS (
        SELECT 1
        FROM public.reservas r
        JOIN public.asientos_reservados a ON a.id = r.asiento_id
        WHERE a.start_time = v_start_time
          AND a.slot_type IN (
              'individual_30'::slot_type_enum,
              'individual_45'::slot_type_enum,
              'individual_60'::slot_type_enum
          )
          AND (
              r.status = 'confirmada'
              OR (r.status = 'pendiente' AND r.hold_expires_at > now())
          )
    ) INTO v_any_active;

    -- Aplicar: si hay activa → todos cerrados; si no → todos abiertos.
    UPDATE public.asientos_reservados
    SET is_open = NOT v_any_active,
        updated_at = now()
    WHERE start_time = v_start_time
      AND slot_type IN (
          'individual_30'::slot_type_enum,
          'individual_45'::slot_type_enum,
          'individual_60'::slot_type_enum
      )
      AND is_open IS DISTINCT FROM (NOT v_any_active);

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_sync_sibling_slots ON public.reservas;
CREATE TRIGGER trg_reservas_sync_sibling_slots
    AFTER INSERT OR UPDATE OR DELETE ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public._reservas_sync_sibling_slots();

-- ════════════════════════════════════════════════════════════════════
-- Backfill: sincronizar el estado actual de `is_open` según reservas
-- existentes. Si alguien ya tenía una reserva confirmada antes del
-- trigger, los hermanos siguen abiertos por error — este bloque los cierra.
-- ════════════════════════════════════════════════════════════════════

UPDATE public.asientos_reservados a
SET is_open = NOT EXISTS (
    SELECT 1
    FROM public.reservas r
    JOIN public.asientos_reservados a2 ON a2.id = r.asiento_id
    WHERE a2.start_time = a.start_time
      AND a2.slot_type IN (
          'individual_30'::slot_type_enum,
          'individual_45'::slot_type_enum,
          'individual_60'::slot_type_enum
      )
      AND (
          r.status = 'confirmada'
          OR (r.status = 'pendiente' AND r.hold_expires_at > now())
      )
),
updated_at = now()
WHERE a.slot_type IN (
    'individual_30'::slot_type_enum,
    'individual_45'::slot_type_enum,
    'individual_60'::slot_type_enum
);

COMMIT;
