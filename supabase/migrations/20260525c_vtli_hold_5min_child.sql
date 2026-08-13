-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Hold de 5 min, columnas del menor, auto-expire
-- 20260525c_vtli_hold_5min_child.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cambios:
--   1. ALTER TABLE vtli_reservas:
--      + is_for_child BOOLEAN DEFAULT false
--      + child_name TEXT
--      + child_age INT
--   2. RPC vtli_create_hold acepta esos 3 params nuevos + baja el hold de
--      15 min a 5 min.
--   3. RPC vtli_get_available_slots ahora ejecuta vtli_expire_holds() de
--      forma inline antes de calcular disponibilidad, así cada fetch del
--      frontend libera los holds vencidos sin depender de un cron job.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ALTER TABLE ─────────────────────────────────────────────────────────────
ALTER TABLE vtli_reservas
    ADD COLUMN IF NOT EXISTS is_for_child BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS child_name TEXT,
    ADD COLUMN IF NOT EXISTS child_age INT;

-- 2. RPC vtli_create_hold (nueva firma con params del menor + hold 5 min) ────
-- Eliminamos la versión vieja (firma distinta) si existe.
DROP FUNCTION IF EXISTS vtli_create_hold(UUID[], TEXT, TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION vtli_create_hold(
    p_slot_ids         UUID[],
    p_nombre           TEXT,
    p_email            TEXT,
    p_telefono         TEXT,
    p_pilar_id         TEXT,
    p_sessions_count   INT,
    p_amount_mxn_cents INT,
    p_is_for_child     BOOLEAN DEFAULT FALSE,
    p_child_name       TEXT DEFAULT NULL,
    p_child_age        INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id UUID := gen_random_uuid();
    v_slot_id  UUID;
    v_idx      INT  := 1;
    v_avail    INT;
BEGIN
    -- Validar disponibilidad de los slots
    FOREACH v_slot_id IN ARRAY p_slot_ids LOOP
        SELECT (capacity - reserved_count) INTO v_avail
            FROM vtli_slots WHERE id = v_slot_id;
        IF v_avail IS NULL THEN
            RAISE EXCEPTION 'slot_id % no existe', v_slot_id;
        END IF;
        IF v_avail <= 0 THEN
            RAISE EXCEPTION 'slot_id % no tiene disponibilidad', v_slot_id;
        END IF;
    END LOOP;

    -- Insertar N filas con expiración a 5 minutos
    FOREACH v_slot_id IN ARRAY p_slot_ids LOOP
        INSERT INTO vtli_reservas (
            slot_id, ciclo_group_id, sequence_in_ciclo,
            nombre, email, telefono, pilar_id, sessions_count,
            status, amount_mxn_cents, expires_at,
            is_for_child, child_name, child_age
        ) VALUES (
            v_slot_id, v_group_id, v_idx,
            p_nombre, p_email, p_telefono, p_pilar_id, p_sessions_count,
            'pendiente', p_amount_mxn_cents,
            NOW() + INTERVAL '5 minutes',
            COALESCE(p_is_for_child, FALSE),
            p_child_name,
            p_child_age
        );
        v_idx := v_idx + 1;
    END LOOP;

    RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_create_hold(
    UUID[], TEXT, TEXT, TEXT, TEXT, INT, INT, BOOLEAN, TEXT, INT
) TO anon, authenticated, service_role;

-- 3. RPC vtli_get_available_slots con auto-expire inline ─────────────────────
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
    -- Primero, liberar holds vencidos automáticamente. Esto garantiza que
    -- el frontend siempre vea la disponibilidad real sin depender de un
    -- cron job externo.
    UPDATE vtli_reservas
        SET status = 'expirada'
        WHERE status = 'pendiente'
          AND expires_at IS NOT NULL
          AND expires_at < NOW();

    -- Luego, devolver los slots con disponibilidad real.
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

-- 4. RPC vtli_confirm_booking_by_session — actualiza para incluir is_for_child
-- (opcional, solo si querés exponer esa info al webhook para email)
CREATE OR REPLACE FUNCTION vtli_confirm_booking_by_session(
    p_stripe_session_id  TEXT,
    p_amount_mxn_cents   INT DEFAULT NULL
)
RETURNS TABLE (
    reserva_id          UUID,
    ciclo_group_id      UUID,
    slot_date           DATE,
    slot_time           TIME,
    sequence_in_ciclo   INT,
    sessions_count      INT,
    pilar_id            TEXT,
    nombre              TEXT,
    email               TEXT,
    telefono            TEXT,
    is_for_child        BOOLEAN,
    child_name          TEXT,
    child_age           INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE vtli_reservas r
        SET status = 'confirmada',
            confirmed_at = NOW(),
            expires_at   = NULL,
            amount_mxn_cents = COALESCE(p_amount_mxn_cents, r.amount_mxn_cents)
        WHERE r.stripe_session_id = p_stripe_session_id
          AND r.status = 'pendiente';

    RETURN QUERY
    SELECT
        r.id,
        r.ciclo_group_id,
        s.slot_date,
        s.slot_time,
        r.sequence_in_ciclo,
        r.sessions_count,
        r.pilar_id,
        r.nombre,
        r.email,
        r.telefono,
        r.is_for_child,
        r.child_name,
        r.child_age
    FROM vtli_reservas r
    JOIN vtli_slots s ON s.id = r.slot_id
    WHERE r.stripe_session_id = p_stripe_session_id
      AND r.status = 'confirmada'
    ORDER BY r.sequence_in_ciclo;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_confirm_booking_by_session(TEXT, INT)
    TO anon, authenticated, service_role;

-- FIN -------------------------------------------------------------------------
