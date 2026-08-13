-- ═══════════════════════════════════════════════════════════════════════════
-- VTLI · Re-locación de sesión individual + trigger para cambio de slot_id
-- 20260525m_vtli_reschedule.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cambios:
--   1. Patch del trigger `vtli_update_slot_count` para manejar cambio de
--      slot_id (reagendar): libera el slot viejo y ocupa el nuevo en una
--      sola transacción atómica.
--   2. RPC nuevo `vtli_manage_reschedule_slot(token, reserva_id, new_slot_id)`
--      que mueve UNA sesión individual a otro slot disponible. Validaciones:
--      · El token debe matchear la fila con ese reserva_id.
--      · La sesión actual debe estar > 48h en zona Cancún.
--      · El nuevo slot debe tener capacidad disponible.
--      · El nuevo slot NO debe estar en martes con sesión 1:1 RSV ese día/hora.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Trigger con manejo de cambio de slot_id (reagendar) ────────────────────
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

        -- Caso A: cambio de slot_id manteniendo estado activo (reagendar)
        IF OLD.slot_id IS DISTINCT FROM NEW.slot_id
           AND old_active AND new_active THEN
            UPDATE vtli_slots
                SET reserved_count = GREATEST(0, reserved_count - 1)
                WHERE id = OLD.slot_id;
            UPDATE vtli_slots
                SET reserved_count = reserved_count + 1
                WHERE id = NEW.slot_id;
            RETURN NEW;
        END IF;

        -- Caso B: liberación pura (activo → cancelado/expirado)
        IF old_active AND NOT new_active THEN
            UPDATE vtli_slots
                SET reserved_count = GREATEST(0, reserved_count - 1)
                WHERE id = NEW.slot_id;
        -- Caso C: recuperación (cancelado/expirado → activo)
        ELSIF NOT old_active AND new_active THEN
            UPDATE vtli_slots
                SET reserved_count = reserved_count + 1
                WHERE id = NEW.slot_id;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) RPC reagendar ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION vtli_manage_reschedule_slot(
    p_manage_token UUID,
    p_reserva_id   UUID,
    p_new_slot_id  UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now_local      TIMESTAMP;
    v_current_dt     TIMESTAMP;
    v_current_slot   UUID;
    v_hours          NUMERIC;
    v_available      INT;
    v_new_date       DATE;
    v_new_time       TIME;
    v_blocked_rsv    BOOLEAN;
BEGIN
    v_now_local := (NOW() AT TIME ZONE 'America/Cancun')::TIMESTAMP;

    -- A) Auth + estado actual del slot
    SELECT s.slot_id, (s2.slot_date + s2.slot_time)::TIMESTAMP
        INTO v_current_slot, v_current_dt
        FROM vtli_reservas s
        JOIN vtli_slots s2 ON s2.id = s.slot_id
        WHERE s.id = p_reserva_id
          AND s.manage_token = p_manage_token
          AND s.status = 'confirmada';

    IF v_current_slot IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'No encontramos esa sesión activa. El enlace puede haber sido manipulado.'
        );
    END IF;

    -- B) Regla 48h sobre la sesión ACTUAL
    v_hours := EXTRACT(EPOCH FROM (v_current_dt - v_now_local)) / 3600.0;
    IF v_hours < 48 THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Tu sesión está dentro de la ventana de 48 horas. El espacio ya está blindado.',
            'hours_remaining', v_hours
        );
    END IF;

    -- C) Validar capacidad + futuro + martes-RSV-1:1 del nuevo slot
    SELECT (s.capacity - s.reserved_count), s.slot_date, s.slot_time
        INTO v_available, v_new_date, v_new_time
        FROM vtli_slots s
        WHERE s.id = p_new_slot_id;

    IF v_available IS NULL THEN
        RETURN json_build_object('success', FALSE, 'error', 'El nuevo espacio no existe.');
    END IF;

    -- Misma sesión actual → no-op, evita gastar capacity
    IF p_new_slot_id = v_current_slot THEN
        RETURN json_build_object('success', FALSE, 'error', 'Ese ya es tu espacio actual.');
    END IF;

    IF v_available <= 0 THEN
        RETURN json_build_object('success', FALSE, 'error', 'Ese espacio acaba de llenarse. Elige otro.');
    END IF;

    -- El nuevo slot debe ser futuro (más de 1 día de anticipación — espejo
    -- de la regla del modal de booking).
    IF v_new_date <= v_now_local::DATE THEN
        RETURN json_build_object('success', FALSE, 'error', 'Solo puedes reubicarte a partir de mañana.');
    END IF;

    -- Guard contra martes RSV 1:1
    IF EXTRACT(ISODOW FROM v_new_date) = 2 THEN
        SELECT EXISTS (
            SELECT 1
            FROM reservas r
            JOIN asientos_reservados ar ON ar.id = r.asiento_id
            WHERE ar.slot_type::text LIKE 'individual_%'
              AND r.status::text IN ('confirmada', 'pendiente')
              AND (ar.start_time AT TIME ZONE 'America/Cancun')::date = v_new_date
              AND (ar.start_time AT TIME ZONE 'America/Cancun')::time = v_new_time
        ) INTO v_blocked_rsv;

        IF v_blocked_rsv THEN
            RETURN json_build_object('success', FALSE, 'error', 'Ese horario está reservado para una sesión 1:1.');
        END IF;
    END IF;

    -- D) Mover la sesión. El trigger ajusta reserved_count en ambos slots.
    UPDATE vtli_reservas
        SET slot_id = p_new_slot_id
        WHERE id = p_reserva_id;

    RETURN json_build_object(
        'success', TRUE,
        'new_slot_date', v_new_date::TEXT,
        'new_slot_time', v_new_time::TEXT
    );
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_manage_reschedule_slot(UUID, UUID, UUID)
    TO anon, authenticated, service_role;

-- FIN ─────────────────────────────────────────────────────────────────────────
