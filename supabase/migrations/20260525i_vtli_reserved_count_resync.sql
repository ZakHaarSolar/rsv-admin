-- ═══════════════════════════════════════════════════════════════════════════
-- VTLI · Trigger inverso + resync masivo de reserved_count
-- 20260525i_vtli_reserved_count_resync.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Contexto del bug:
--   El trigger `vtli_update_slot_count` solo maneja dos transiciones:
--     · INSERT con status activo  → reserved_count += 1
--     · UPDATE activo → cancelada/expirada → reserved_count -= 1
--   NO maneja la transición inversa (expirada/cancelada → pendiente/
--   confirmada), que es justamente la que se ejecuta en una recuperación
--   manual. Resultado: tras el reset de END to END a 'pendiente' + confirm
--   RPC, las 3 filas quedaron en 'confirmada' pero los 3 slots siguieron
--   con `reserved_count = 0` → el modal de booking del Tutor muestra los
--   horarios como disponibles → riesgo de overbooking.
--
-- Cambios:
--   1. Rewrite del trigger para manejar TODAS las transiciones de status.
--   2. Resync masivo: recalcula `reserved_count` de TODOS los slots desde
--      cero contando filas activas en vtli_reservas (idempotente, seguro
--      correrlo cuantas veces haga falta).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Trigger nuevo · maneja transiciones bidireccionales ───────────────────
CREATE OR REPLACE FUNCTION vtli_update_slot_count()
RETURNS TRIGGER AS $$
DECLARE
    old_active BOOLEAN;
    new_active BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('pendiente', 'confirmada') THEN
            UPDATE vtli_slots
                SET reserved_count = reserved_count + 1
                WHERE id = NEW.slot_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        old_active := OLD.status IN ('pendiente', 'confirmada');
        new_active := NEW.status IN ('pendiente', 'confirmada');

        -- Liberación: activo → terminado
        IF old_active AND NOT new_active THEN
            UPDATE vtli_slots
                SET reserved_count = GREATEST(0, reserved_count - 1)
                WHERE id = NEW.slot_id;
        -- Recuperación: terminado → activo
        ELSIF NOT old_active AND new_active THEN
            UPDATE vtli_slots
                SET reserved_count = reserved_count + 1
                WHERE id = NEW.slot_id;
        -- (activo → activo o terminado → terminado: no cambia el contador)
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Resync masivo · recalcula reserved_count desde cero ───────────────────
UPDATE vtli_slots s
    SET reserved_count = COALESCE((
        SELECT COUNT(*)
        FROM vtli_reservas r
        WHERE r.slot_id = s.id
          AND r.status IN ('pendiente', 'confirmada')
    ), 0);

-- 3) Verificación · slots con reservas activas tras el resync ──────────────
SELECT s.slot_date,
       s.slot_time,
       s.capacity,
       s.reserved_count,
       (s.capacity - s.reserved_count) AS disponibles
FROM vtli_slots s
WHERE s.reserved_count > 0
ORDER BY s.slot_date, s.slot_time;

-- FIN ─────────────────────────────────────────────────────────────────────────
