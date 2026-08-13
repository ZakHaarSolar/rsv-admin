-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Motor de Reservas Nativo
-- 20260523_vtli_motor_reservas.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Crea:
--   · ENUM vtli_reserva_status
--   · Tablas vtli_slots + vtli_reservas
--   · Trigger que mantiene reserved_count en sync
--   · Seeds de 8 semanas con horarios Lun/Mar/Mié
--   · RPCs SECURITY DEFINER:
--       - vtli_get_available_slots(p_weeks_ahead)  · lectura desde UI
--       - vtli_create_hold(...)                    · llamado por edge function
--       - vtli_attach_stripe_session(...)          · llamado por edge function
--       - vtli_confirm_booking_by_session(...)     · llamado por Pipedream
--       - vtli_expire_holds()                      · cron de limpieza
--
-- IMPORTANTE — guard contra RSV 1:1 los martes:
--   El RPC vtli_get_available_slots excluye los slots de MARTES que ya tengan
--   una sesión 1:1 confirmada en RSV (reservas.slot_type LIKE 'individual_%').
--   Si tu schema RSV usa NOMBRES DISTINTOS de columnas, ajusta el bloque del
--   `NOT EXISTS` marcado con « ⚠ AJUSTAR SI EL SCHEMA RSV DIFIERE » abajo.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ENUM ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE vtli_reserva_status AS ENUM (
        'pendiente', 'confirmada', 'cancelada', 'expirada'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabla de SLOTS -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vtli_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_date       DATE NOT NULL,
    slot_time       TIME NOT NULL,
    capacity        INT  NOT NULL DEFAULT 1,
    reserved_count  INT  NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_vtli_slots_date ON vtli_slots(slot_date);

ALTER TABLE vtli_slots ENABLE ROW LEVEL SECURITY;
-- Acceso solo vía RPCs SECURITY DEFINER. Sin policies → bloqueado para anon/auth.

-- 3. Tabla de RESERVAS --------------------------------------------------------
CREATE TABLE IF NOT EXISTS vtli_reservas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id             UUID NOT NULL REFERENCES vtli_slots(id) ON DELETE RESTRICT,
    ciclo_group_id      UUID NOT NULL,
    sequence_in_ciclo   INT  NOT NULL DEFAULT 1,
    nombre              TEXT NOT NULL,
    email               TEXT NOT NULL,
    telefono            TEXT,
    pilar_id            TEXT NOT NULL,
    sessions_count      INT  NOT NULL DEFAULT 1,
    status              vtli_reserva_status NOT NULL DEFAULT 'pendiente',
    stripe_session_id   TEXT,
    amount_mxn_cents    INT  NOT NULL DEFAULT 0,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vtli_reservas_session ON vtli_reservas(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_vtli_reservas_group   ON vtli_reservas(ciclo_group_id);
CREATE INDEX IF NOT EXISTS idx_vtli_reservas_email   ON vtli_reservas(email);
CREATE INDEX IF NOT EXISTS idx_vtli_reservas_status  ON vtli_reservas(status);

ALTER TABLE vtli_reservas ENABLE ROW LEVEL SECURITY;

-- 4. Trigger de sincronización de reserved_count ------------------------------
-- Filas en estado 'pendiente' o 'confirmada' ocupan el slot.
-- Al pasar a 'cancelada' o 'expirada', se libera.
CREATE OR REPLACE FUNCTION vtli_update_slot_count()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT con estado activo → ocupar
    IF (TG_OP = 'INSERT' AND NEW.status IN ('pendiente', 'confirmada')) THEN
        UPDATE vtli_slots
            SET reserved_count = reserved_count + 1
            WHERE id = NEW.slot_id;
    END IF;

    -- UPDATE de pendiente/confirmada → cancelada/expirada = liberar
    IF (TG_OP = 'UPDATE'
        AND OLD.status IN ('pendiente', 'confirmada')
        AND NEW.status IN ('cancelada', 'expirada')) THEN
        UPDATE vtli_slots
            SET reserved_count = GREATEST(0, reserved_count - 1)
            WHERE id = NEW.slot_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vtli_slot_count_ins ON vtli_reservas;
CREATE TRIGGER trg_vtli_slot_count_ins
    AFTER INSERT ON vtli_reservas
    FOR EACH ROW EXECUTE FUNCTION vtli_update_slot_count();

DROP TRIGGER IF EXISTS trg_vtli_slot_count_upd ON vtli_reservas;
CREATE TRIGGER trg_vtli_slot_count_upd
    AFTER UPDATE ON vtli_reservas
    FOR EACH ROW EXECUTE FUNCTION vtli_update_slot_count();

-- 5. SEEDS de 8 semanas hacia adelante ----------------------------------------
-- Lunes 15:00 / 16:00 / 17:00 · Martes 16:00 / 17:00 · Miércoles 15:00 / 16:00 / 17:00.
-- Idempotente (ON CONFLICT DO NOTHING).
DO $$
DECLARE
    week_offset    INT;
    day_offset     INT;
    target_date    DATE;
    dow            INT;
    schedule_times TIME[];
    t              TIME;
BEGIN
    FOR week_offset IN 0..7 LOOP
        FOR day_offset IN 0..6 LOOP
            target_date := CURRENT_DATE + (week_offset * 7) + day_offset;
            dow := EXTRACT(ISODOW FROM target_date)::INT; -- 1=Lun, 7=Dom
            IF dow = 1 THEN
                schedule_times := ARRAY['15:00:00'::TIME, '16:00:00'::TIME, '17:00:00'::TIME];
            ELSIF dow = 2 THEN
                schedule_times := ARRAY['16:00:00'::TIME, '17:00:00'::TIME];
            ELSIF dow = 3 THEN
                schedule_times := ARRAY['15:00:00'::TIME, '16:00:00'::TIME, '17:00:00'::TIME];
            ELSE
                schedule_times := ARRAY[]::TIME[];
            END IF;
            FOREACH t IN ARRAY schedule_times LOOP
                INSERT INTO vtli_slots (slot_date, slot_time, capacity, reserved_count)
                    VALUES (target_date, t, 1, 0)
                    ON CONFLICT (slot_date, slot_time) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- 6. RPC: vtli_get_available_slots --------------------------------------------
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
      -- ⚠ AJUSTAR SI EL SCHEMA RSV DIFIERE ────────────────────────────────────
      -- Guard contra martes RSV 1:1: si es martes Y existe una reserva 1:1
      -- confirmada de RSV cuyo slot coincide en fecha y hora, ocultar.
      AND NOT (
          EXTRACT(ISODOW FROM s.slot_date) = 2
          AND EXISTS (
              SELECT 1
              FROM reservas r
              JOIN asientos_reservados ar ON ar.id = r.slot_id
              WHERE ar.slot_type LIKE 'individual_%'
                AND r.status = 'confirmada'
                AND ar.slot_date = s.slot_date
                AND ar.slot_time = s.slot_time
          )
      )
      -- ───────────────────────────────────────────────────────────────────────
    ORDER BY s.slot_date, s.slot_time;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_get_available_slots(INT) TO anon, authenticated;

-- 7. RPC: vtli_create_hold ----------------------------------------------------
-- Crea N filas en vtli_reservas con ciclo_group_id común. Status 'pendiente'.
-- expires_at = NOW() + 15 min. Devuelve el group_id (UUID).
CREATE OR REPLACE FUNCTION vtli_create_hold(
    p_slot_ids         UUID[],
    p_nombre           TEXT,
    p_email            TEXT,
    p_telefono         TEXT,
    p_pilar_id         TEXT,
    p_sessions_count   INT,
    p_amount_mxn_cents INT
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
    -- Validar disponibilidad antes de insertar
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

    -- Insertar las N filas
    FOREACH v_slot_id IN ARRAY p_slot_ids LOOP
        INSERT INTO vtli_reservas (
            slot_id, ciclo_group_id, sequence_in_ciclo,
            nombre, email, telefono, pilar_id, sessions_count,
            status, amount_mxn_cents, expires_at
        ) VALUES (
            v_slot_id, v_group_id, v_idx,
            p_nombre, p_email, p_telefono, p_pilar_id, p_sessions_count,
            'pendiente', p_amount_mxn_cents,
            NOW() + INTERVAL '15 minutes'
        );
        v_idx := v_idx + 1;
    END LOOP;

    RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_create_hold(UUID[], TEXT, TEXT, TEXT, TEXT, INT, INT)
    TO anon, authenticated;

-- 8. RPC: vtli_attach_stripe_session ------------------------------------------
CREATE OR REPLACE FUNCTION vtli_attach_stripe_session(
    p_group_id           UUID,
    p_stripe_session_id  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE vtli_reservas
        SET stripe_session_id = p_stripe_session_id
        WHERE ciclo_group_id = p_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_attach_stripe_session(UUID, TEXT)
    TO anon, authenticated;

-- 9. RPC: vtli_confirm_booking_by_session -------------------------------------
-- Pipedream Compras.js lo llama al recibir checkout.session.completed.
-- Pasa todas las filas con ese stripe_session_id de 'pendiente' a 'confirmada'
-- y devuelve los datos de cada sesión para componer el correo.
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
    telefono            TEXT
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
        r.telefono
    FROM vtli_reservas r
    JOIN vtli_slots s ON s.id = r.slot_id
    WHERE r.stripe_session_id = p_stripe_session_id
      AND r.status = 'confirmada'
    ORDER BY r.sequence_in_ciclo;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_confirm_booking_by_session(TEXT, INT)
    TO anon, authenticated, service_role;

-- 10. RPC: vtli_expire_holds --------------------------------------------------
-- Cron job (Supabase Scheduled Functions) — corre cada 5 minutos.
CREATE OR REPLACE FUNCTION vtli_expire_holds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE vtli_reservas
        SET status = 'expirada'
        WHERE status = 'pendiente'
          AND expires_at < NOW();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_expire_holds() TO anon, authenticated, service_role;

-- FIN -------------------------------------------------------------------------
