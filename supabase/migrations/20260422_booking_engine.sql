-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Motor de Reservas Atómico (v1)
-- Fecha: 2026-04-22
--
-- Reemplaza Calendly. Maneja:
--   · Sesiones grupales (Cámara Solar) — capacidad hasta 22 por slot
--   · Sesiones 1:1 (Cámara de Resonancia) — capacidad 1 por slot, 30/45/60 min
--
-- Lógica atómica: DISPONIBLE → RESERVA_TEMPORAL (15 min hold) → CONFIRMADA
--   · Hold se crea cuando el tripulante apreta "Pagar" (antes del checkout).
--   · Hold expira a los 15 min si no se confirma vía Stripe webhook.
--   · Confirmación vía Stripe webhook (checkout.session.completed) cambia
--     el slot a CONFIRMADA y decrementa la capacidad disponible.
--   · Cron cada 5 min libera holds expirados (RPC release_expired_holds).
--
-- Antes de aplicar: revisar que las tablas no existen ya con otro schema.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_type_enum') THEN
        CREATE TYPE slot_type_enum AS ENUM (
            'grupal_pulsar',     -- Cámara Solar 12:30 PM Cancún
            'grupal_cuasar',     -- Cámara Solar 4:30 PM Cancún (no en uso aún)
            'individual_30',     -- Cámara de Resonancia 30 min
            'individual_45',     -- Cámara de Resonancia 45 min
            'individual_60'      -- Cámara de Resonancia 60 min
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reserva_status_enum') THEN
        CREATE TYPE reserva_status_enum AS ENUM (
            'pendiente',         -- Hold creado, esperando confirmación de Stripe
            'confirmada',        -- Pago confirmado por webhook
            'cancelada',         -- Cancelada manualmente o por refund
            'expirada'           -- Hold expiró sin pago
        );
    END IF;
END$$;

-- ════════════════════════════════════════════════════════════════════
-- 2. TABLA `asientos_reservados` (slots de tiempo disponibles)
--
-- Cada fila = un slot puntual en el calendario.
-- Para grupales: capacity = 22, las reservas confirmadas se acumulan.
-- Para individuales: capacity = 1, una sola reserva confirmada por slot.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.asientos_reservados (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_type       slot_type_enum NOT NULL,
    start_time      timestamptz NOT NULL,
    end_time        timestamptz NOT NULL,
    capacity        int NOT NULL DEFAULT 1 CHECK (capacity > 0),
    -- Contadores derivados (mantenidos por triggers/RPCs):
    confirmed_count int NOT NULL DEFAULT 0 CHECK (confirmed_count >= 0),
    held_count      int NOT NULL DEFAULT 0 CHECK (held_count >= 0),
    -- Soft-close manual (admin puede cerrar un slot a mano):
    is_open         boolean NOT NULL DEFAULT true,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT slot_capacity_not_exceeded
        CHECK (confirmed_count + held_count <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_asientos_start_time
    ON public.asientos_reservados (start_time);
CREATE INDEX IF NOT EXISTS idx_asientos_slot_type_start
    ON public.asientos_reservados (slot_type, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS uq_asientos_type_start
    ON public.asientos_reservados (slot_type, start_time);

-- ════════════════════════════════════════════════════════════════════
-- 3. TABLA `reservas` (bookings individuales)
--
-- Cada fila = un tripulante reservando UN asiento.
-- Para grupales un mismo asiento puede tener N reservas.
-- Para individuales un asiento tiene exactamente 1 reserva confirmada.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reservas (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asiento_id                  uuid NOT NULL REFERENCES public.asientos_reservados(id) ON DELETE RESTRICT,
    clerk_user_id               text,                    -- nullable: explorers no logueados
    name                        text NOT NULL,
    email                       text NOT NULL CHECK (position('@' in email) > 1),
    status                      reserva_status_enum NOT NULL DEFAULT 'pendiente',
    stripe_session_id           text UNIQUE,             -- Stripe Checkout Session ID
    stripe_payment_intent_id    text,
    amount_mxn_cents            int NOT NULL CHECK (amount_mxn_cents >= 0),
    hold_expires_at             timestamptz,             -- cuando el hold debe liberar
    confirmed_at                timestamptz,
    cancelled_at                timestamptz,
    cancel_reason               text,
    google_event_id             text,                    -- ID del evento creado en Google Calendar
    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservas_asiento ON public.reservas (asiento_id);
CREATE INDEX IF NOT EXISTS idx_reservas_email_status ON public.reservas (email, status);
CREATE INDEX IF NOT EXISTS idx_reservas_clerk_user ON public.reservas (clerk_user_id) WHERE clerk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservas_status_hold ON public.reservas (status, hold_expires_at)
    WHERE status = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_reservas_stripe_session ON public.reservas (stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════
-- 4. TRIGGER: actualizar contadores del asiento cuando cambian reservas
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._reservas_sync_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_id uuid;
BEGIN
    target_id := COALESCE(NEW.asiento_id, OLD.asiento_id);
    UPDATE public.asientos_reservados a
    SET
        confirmed_count = (
            SELECT count(*) FROM public.reservas
            WHERE asiento_id = target_id AND status = 'confirmada'
        ),
        held_count = (
            SELECT count(*) FROM public.reservas
            WHERE asiento_id = target_id
              AND status = 'pendiente'
              AND hold_expires_at > now()
        ),
        updated_at = now()
    WHERE a.id = target_id;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_sync_counts ON public.reservas;
CREATE TRIGGER trg_reservas_sync_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public._reservas_sync_counts();

-- ════════════════════════════════════════════════════════════════════
-- 5. RPC `get_available_slots`
--
-- Devuelve slots abiertos en una ventana de tiempo, con cupos restantes.
-- ════════════════════════════════════════════════════════════════════

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
    ORDER BY a.start_time ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 6. RPC `create_booking_hold`
--
-- Reserva temporal (15 min). Devuelve el reservation_id que el caller
-- debe pasarle a Stripe como metadata para que el webhook lo confirme.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_booking_hold(
    p_asiento_id        uuid,
    p_name              text,
    p_email             text,
    p_amount_mxn_cents  int,
    p_clerk_user_id     text DEFAULT NULL,
    p_hold_minutes      int DEFAULT 15
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_asiento public.asientos_reservados%ROWTYPE;
    v_reserva_id uuid;
BEGIN
    -- Lock pesimista del slot para evitar race conditions
    SELECT * INTO v_asiento
    FROM public.asientos_reservados
    WHERE id = p_asiento_id
    FOR UPDATE;

    IF v_asiento.id IS NULL THEN
        RAISE EXCEPTION 'Slot no existe' USING ERRCODE = 'P0002';
    END IF;

    IF NOT v_asiento.is_open THEN
        RAISE EXCEPTION 'Slot cerrado' USING ERRCODE = 'P0001';
    END IF;

    IF v_asiento.start_time < now() THEN
        RAISE EXCEPTION 'Slot ya pasó' USING ERRCODE = 'P0001';
    END IF;

    IF (v_asiento.confirmed_count + v_asiento.held_count) >= v_asiento.capacity THEN
        RAISE EXCEPTION 'Slot lleno' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.reservas (
        asiento_id, clerk_user_id, name, email,
        status, amount_mxn_cents, hold_expires_at
    )
    VALUES (
        p_asiento_id,
        p_clerk_user_id,
        trim(p_name),
        lower(trim(p_email)),
        'pendiente',
        p_amount_mxn_cents,
        now() + make_interval(mins => p_hold_minutes)
    )
    RETURNING id INTO v_reserva_id;

    RETURN v_reserva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking_hold TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 7. RPC `confirm_booking_by_session`
--
-- Llamado por el Stripe webhook al recibir checkout.session.completed.
-- Marca la reserva como CONFIRMADA y guarda el payment_intent.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.confirm_booking_by_session(
    p_stripe_session_id         text,
    p_stripe_payment_intent_id  text DEFAULT NULL
)
RETURNS TABLE (
    reserva_id      uuid,
    asiento_id      uuid,
    slot_type       slot_type_enum,
    start_time      timestamptz,
    end_time        timestamptz,
    name            text,
    email           text,
    clerk_user_id   text,
    amount_mxn_cents int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    UPDATE public.reservas
    SET
        status = 'confirmada',
        stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
        confirmed_at = now(),
        hold_expires_at = NULL,
        updated_at = now()
    WHERE stripe_session_id = p_stripe_session_id
      AND status IN ('pendiente', 'confirmada')   -- idempotente
    RETURNING reservas.id INTO v_id;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Reserva no encontrada para session %', p_stripe_session_id
            USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY
        SELECT
            r.id, r.asiento_id, a.slot_type, a.start_time, a.end_time,
            r.name, r.email, r.clerk_user_id, r.amount_mxn_cents
        FROM public.reservas r
        JOIN public.asientos_reservados a ON a.id = r.asiento_id
        WHERE r.id = v_id;
END;
$$;

-- service_role solamente — el webhook de Stripe corre con esa llave.
REVOKE ALL ON FUNCTION public.confirm_booking_by_session FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 8. RPC `attach_stripe_session`
--
-- Vincula la reserva pendiente con el Stripe Checkout Session ID
-- justo después de crearla en la edge function.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.attach_stripe_session(
    p_reserva_id        uuid,
    p_stripe_session_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.reservas
    SET stripe_session_id = p_stripe_session_id, updated_at = now()
    WHERE id = p_reserva_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva no existe: %', p_reserva_id USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_stripe_session FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 9. RPC `release_expired_holds`
--
-- Cron job cada 5 min. Marca como 'expirada' cualquier reserva
-- pendiente cuyo hold_expires_at ya pasó. El trigger sync_counts
-- decrementa held_count automáticamente.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count int;
BEGIN
    WITH expired AS (
        UPDATE public.reservas
        SET status = 'expirada',
            updated_at = now(),
            cancel_reason = 'hold_expired'
        WHERE status = 'pendiente'
          AND hold_expires_at < now()
        RETURNING 1
    )
    SELECT count(*) INTO v_count FROM expired;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.release_expired_holds FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 10. RPC `seed_tuesday_slots`  (admin tool)
--
-- Genera slots para los próximos N martes a partir de una fecha.
-- Crea: 1 grupal_pulsar 12:30 PM + 5 individuales (10am, 11:15am,
-- 3pm, 4:15pm, 5:30pm — los horarios del screenshot de Diego).
--
-- Idempotente vía UNIQUE constraint (slot_type, start_time).
-- ════════════════════════════════════════════════════════════════════

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
    -- Cancún = UTC-5 sin DST. 12:30 PM Cancún = 17:30 UTC.
    -- Slots individuales (Cancún): 10:00, 11:15, 15:00, 16:15, 17:30.
    -- En UTC: 15:00, 16:15, 20:00, 21:15, 22:30.
BEGIN
    -- Encontrar el próximo martes (incluyendo hoy si es martes).
    v_first_tuesday := v_today + ((2 - extract(dow FROM v_today)::int + 7) % 7);

    FOR i IN 0..(p_weeks_ahead - 1) LOOP
        v_d := v_first_tuesday + (i * 7);

        -- Grupal Púlsar 12:30 PM Cancún (= 17:30 UTC), duración 90 min.
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'grupal_pulsar',
            (v_d || ' 17:30:00+00')::timestamptz,
            (v_d || ' 19:00:00+00')::timestamptz,
            p_grupal_capacity
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        -- Individual 60 min: 10:00 Cancún (15:00 UTC).
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'individual_60',
            (v_d || ' 15:00:00+00')::timestamptz,
            (v_d || ' 16:00:00+00')::timestamptz,
            1
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        -- Individual 60 min: 11:15 Cancún (16:15 UTC).
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'individual_60',
            (v_d || ' 16:15:00+00')::timestamptz,
            (v_d || ' 17:15:00+00')::timestamptz,
            1
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        -- Individual 60 min: 15:00 Cancún (20:00 UTC).
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'individual_60',
            (v_d || ' 20:00:00+00')::timestamptz,
            (v_d || ' 21:00:00+00')::timestamptz,
            1
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        -- Individual 60 min: 16:15 Cancún (21:15 UTC).
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'individual_60',
            (v_d || ' 21:15:00+00')::timestamptz,
            (v_d || ' 22:15:00+00')::timestamptz,
            1
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;

        -- Individual 60 min: 17:30 Cancún (22:30 UTC).
        INSERT INTO public.asientos_reservados
            (slot_type, start_time, end_time, capacity)
        VALUES (
            'individual_60',
            (v_d || ' 22:30:00+00')::timestamptz,
            (v_d || ' 23:30:00+00')::timestamptz,
            1
        )
        ON CONFLICT (slot_type, start_time) DO NOTHING;
        IF FOUND THEN v_inserted := v_inserted + 1; END IF;
    END LOOP;

    RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_tuesday_slots FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 11. RLS — anon puede leer slots disponibles vía RPC, no la tabla cruda
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.asientos_reservados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Sin policies = sin acceso directo. Todo va por RPCs SECURITY DEFINER.

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- POST-DEPLOY (correr manual una vez)
-- ════════════════════════════════════════════════════════════════════
-- 1. Sembrar slots para los próximos 12 martes:
--      SELECT public.seed_tuesday_slots(12);
--
-- 2. Programar release_expired_holds en pg_cron (si está disponible):
--      SELECT cron.schedule(
--          'release-expired-booking-holds',
--          '*/5 * * * *',
--          $$ SELECT public.release_expired_holds(); $$
--      );
--    Alternativa: cron job en Pipedream que llame el RPC vía REST.
-- ════════════════════════════════════════════════════════════════════
