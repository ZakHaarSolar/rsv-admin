-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Fix raíz del confirm + sistema de Enlaces Mágicos
-- 20260525f_vtli_magic_link_and_confirm_fix.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- 1. Agrega columna `manage_token UUID` a `vtli_reservas` (mismo token por
--    ciclo completo). Backfill seguro para reservas existentes.
-- 2. Reemplaza `vtli_create_hold` por una firma que acepta `p_group_id` y
--    `p_stripe_session_id` desde la edge function — atómico: si falla el
--    INSERT, no queda nada huérfano. Devuelve JSON con group_id +
--    manage_token.
-- 3. Crea `vtli_manage_get_booking(token)` y `vtli_manage_cancel_booking(token)`
--    con la Regla de las 48 horas. Sin admin gate (cualquiera con el token
--    puede leer/cancelar — la seguridad es la opacidad del UUID).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Columna manage_token ───────────────────────────────────────────────────
ALTER TABLE vtli_reservas
    ADD COLUMN IF NOT EXISTS manage_token UUID;

-- Backfill: mismo token por ciclo_group_id en reservas pre-existentes.
WITH tokens AS (
    SELECT DISTINCT ciclo_group_id, gen_random_uuid() AS token
    FROM vtli_reservas
    WHERE manage_token IS NULL
)
UPDATE vtli_reservas r
    SET manage_token = t.token
    FROM tokens t
    WHERE r.ciclo_group_id = t.ciclo_group_id
      AND r.manage_token IS NULL;

ALTER TABLE vtli_reservas
    ALTER COLUMN manage_token SET NOT NULL;

ALTER TABLE vtli_reservas
    ALTER COLUMN manage_token SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_vtli_reservas_manage_token
    ON vtli_reservas(manage_token);

-- 2. vtli_create_hold · nueva firma atómica ─────────────────────────────────
-- Eliminamos las firmas anteriores (7 args y 10 args).
DROP FUNCTION IF EXISTS vtli_create_hold(UUID[], TEXT, TEXT, TEXT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS vtli_create_hold(UUID[], TEXT, TEXT, TEXT, TEXT, INT, INT, BOOLEAN, TEXT, INT);

CREATE OR REPLACE FUNCTION vtli_create_hold(
    p_slot_ids          UUID[],
    p_nombre            TEXT,
    p_email             TEXT,
    p_telefono          TEXT,
    p_pilar_id          TEXT,
    p_sessions_count    INT,
    p_amount_mxn_cents  INT,
    p_is_for_child      BOOLEAN DEFAULT FALSE,
    p_child_name        TEXT DEFAULT NULL,
    p_child_age         INT DEFAULT NULL,
    p_group_id          UUID DEFAULT NULL,
    p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id     UUID := COALESCE(p_group_id, gen_random_uuid());
    v_manage_token UUID := gen_random_uuid();
    v_slot_id      UUID;
    v_idx          INT  := 1;
    v_avail        INT;
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

    -- Insertar N filas con TODO ya cableado (group_id + stripe_session_id +
    -- manage_token) en una sola transacción. Atomic.
    FOREACH v_slot_id IN ARRAY p_slot_ids LOOP
        INSERT INTO vtli_reservas (
            slot_id, ciclo_group_id, sequence_in_ciclo,
            nombre, email, telefono, pilar_id, sessions_count,
            status, amount_mxn_cents, expires_at,
            is_for_child, child_name, child_age,
            manage_token, stripe_session_id
        ) VALUES (
            v_slot_id, v_group_id, v_idx,
            p_nombre, p_email, p_telefono, p_pilar_id, p_sessions_count,
            'pendiente', p_amount_mxn_cents,
            NOW() + INTERVAL '5 minutes',
            COALESCE(p_is_for_child, FALSE),
            p_child_name,
            p_child_age,
            v_manage_token,
            p_stripe_session_id
        );
        v_idx := v_idx + 1;
    END LOOP;

    RETURN json_build_object(
        'group_id', v_group_id,
        'manage_token', v_manage_token
    );
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_create_hold(
    UUID[], TEXT, TEXT, TEXT, TEXT, INT, INT, BOOLEAN, TEXT, INT, UUID, TEXT
) TO anon, authenticated, service_role;

-- Refuerzo de grants para los RPCs existentes (algunos sin service_role)
GRANT EXECUTE ON FUNCTION vtli_attach_stripe_session(UUID, TEXT)
    TO anon, authenticated, service_role;

-- 2b. vtli_confirm_booking_by_session · ahora también devuelve manage_token --
-- Pipedream Compras.js lee la primera fila para construir el botón Magic.
DROP FUNCTION IF EXISTS vtli_confirm_booking_by_session(TEXT, INT);

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
    child_age           INT,
    manage_token        UUID
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
        r.child_age,
        r.manage_token
    FROM vtli_reservas r
    JOIN vtli_slots s ON s.id = r.slot_id
    WHERE r.stripe_session_id = p_stripe_session_id
      AND r.status = 'confirmada'
    ORDER BY r.sequence_in_ciclo;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_confirm_booking_by_session(TEXT, INT)
    TO anon, authenticated, service_role;

-- 3. vtli_manage_get_booking · lectura pública por token ────────────────────
CREATE OR REPLACE FUNCTION vtli_manage_get_booking(
    p_manage_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result          JSON;
    v_first_dt        TIMESTAMP;
    v_hours_to_first  NUMERIC;
    v_now_local       TIMESTAMP;
BEGIN
    -- Existencia
    IF NOT EXISTS (
        SELECT 1 FROM vtli_reservas
        WHERE manage_token = p_manage_token
    ) THEN
        RETURN json_build_object('exists', false);
    END IF;

    -- Primer slot futuro CONFIRMADO (en zona de Cancún)
    v_now_local := (NOW() AT TIME ZONE 'America/Cancun')::TIMESTAMP;

    SELECT (s.slot_date + s.slot_time)::TIMESTAMP
        INTO v_first_dt
        FROM vtli_reservas r
        JOIN vtli_slots s ON s.id = r.slot_id
        WHERE r.manage_token = p_manage_token
          AND r.status = 'confirmada'
          AND (s.slot_date + s.slot_time)::TIMESTAMP > v_now_local
        ORDER BY s.slot_date ASC, s.slot_time ASC
        LIMIT 1;

    IF v_first_dt IS NULL THEN
        v_hours_to_first := NULL;
    ELSE
        v_hours_to_first := EXTRACT(EPOCH FROM (v_first_dt - v_now_local)) / 3600.0;
    END IF;

    SELECT json_build_object(
        'exists', TRUE,
        'permite_cambios',
            CASE
                WHEN v_hours_to_first IS NULL THEN FALSE
                WHEN v_hours_to_first >= 48 THEN TRUE
                ELSE FALSE
            END,
        'hours_to_first_slot', v_hours_to_first,
        'ciclo', json_build_object(
            'ciclo_group_id', MIN(r.ciclo_group_id::TEXT),
            'pilar_id', MIN(r.pilar_id),
            'sessions_count', MIN(r.sessions_count),
            'nombre', MIN(r.nombre),
            'email', MIN(r.email),
            'telefono', MIN(r.telefono),
            'is_for_child', BOOL_OR(r.is_for_child),
            'child_name', MIN(r.child_name),
            'child_age', MIN(r.child_age),
            'amount_total_mxn_cents', MIN(r.amount_mxn_cents) * MIN(r.sessions_count),
            'overall_status',
                CASE
                    WHEN BOOL_AND(r.status = 'cancelada') THEN 'cancelada'
                    WHEN BOOL_OR(r.status = 'confirmada') THEN 'confirmada'
                    ELSE MIN(r.status::TEXT)
                END
        ),
        'slots', (
            SELECT json_agg(
                json_build_object(
                    'reserva_id', r2.id::TEXT,
                    'slot_date', s2.slot_date,
                    'slot_time', s2.slot_time::TEXT,
                    'sequence', r2.sequence_in_ciclo,
                    'status', r2.status::TEXT,
                    'is_past',
                        ((s2.slot_date + s2.slot_time)::TIMESTAMP
                            <= v_now_local)
                )
                ORDER BY r2.sequence_in_ciclo
            )
            FROM vtli_reservas r2
            JOIN vtli_slots s2 ON s2.id = r2.slot_id
            WHERE r2.manage_token = p_manage_token
        )
    ) INTO v_result
    FROM vtli_reservas r
    WHERE r.manage_token = p_manage_token;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_manage_get_booking(UUID)
    TO anon, authenticated, service_role;

-- 4. vtli_manage_cancel_booking · cancela ciclo si > 48h ────────────────────
CREATE OR REPLACE FUNCTION vtli_manage_cancel_booking(
    p_manage_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_first_dt   TIMESTAMP;
    v_now_local  TIMESTAMP;
    v_hours      NUMERIC;
    v_cancelled  INT;
BEGIN
    v_now_local := (NOW() AT TIME ZONE 'America/Cancun')::TIMESTAMP;

    SELECT (s.slot_date + s.slot_time)::TIMESTAMP
        INTO v_first_dt
        FROM vtli_reservas r
        JOIN vtli_slots s ON s.id = r.slot_id
        WHERE r.manage_token = p_manage_token
          AND r.status = 'confirmada'
          AND (s.slot_date + s.slot_time)::TIMESTAMP > v_now_local
        ORDER BY s.slot_date ASC, s.slot_time ASC
        LIMIT 1;

    IF v_first_dt IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'No hay sesiones futuras confirmadas en este ciclo.'
        );
    END IF;

    v_hours := EXTRACT(EPOCH FROM (v_first_dt - v_now_local)) / 3600.0;

    IF v_hours < 48 THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Tu sesión está dentro de la ventana de 48 horas. El espacio ya está blindado y no admite modificaciones desde el sistema.',
            'hours_remaining', v_hours
        );
    END IF;

    UPDATE vtli_reservas
        SET status = 'cancelada'
        WHERE manage_token = p_manage_token
          AND status IN ('confirmada', 'pendiente');
    GET DIAGNOSTICS v_cancelled = ROW_COUNT;

    RETURN json_build_object(
        'success', TRUE,
        'cancelled_count', v_cancelled,
        'hours_to_first_slot', v_hours
    );
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_manage_cancel_booking(UUID)
    TO anon, authenticated, service_role;

-- FIN ─────────────────────────────────────────────────────────────────────────
