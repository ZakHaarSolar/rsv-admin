-- 20260430_cristales_extraccion.sql
-- Sistema de Cristales de Extracción
--
-- Producto: cada Tripulante con suscripción activa (Sintonía Solar
-- $777 MXN/mes o Inmersión Solar $1,999 MXN/mes) recibe 2 cristales
-- por mes lunar al confirmarse el pago de suscripción / renovación.
-- Un cristal de tipo `codice` canjea cualquier Códice de Luz; un
-- cristal de tipo `meditacion` canjea cualquier Meditación de la
-- Holoteca. Acumulables (no expiran al final del mes), individuales
-- por Tripulante.
--
-- Inmersión Solar tiene acceso libre a TODAS las meditaciones (la
-- UI no requiere canje para meditaciones). Sintonía Solar usa
-- cristales para acceder. Ambos usan cristales para Códices.
--
-- Acceso: tabla con RLS denied; lectura/escritura solo vía RPCs
-- SECURITY DEFINER (`get_my_cristales`, `canjear_cristal`,
-- `emit_cristales_for_subscription`). Patrón canónico RSV: el
-- frontend llama RPCs vía REST con anon key, el SECURITY DEFINER
-- bypassa RLS para hacer el trabajo. Idempotencia por
-- (clerk_user_id, mes_lunar, origen) en la emisión.

CREATE TABLE IF NOT EXISTS public.cristales_extraccion (
    id uuid primary key default gen_random_uuid(),
    clerk_user_id text not null,
    tipo text not null check (tipo in ('codice', 'meditacion')),
    origen text not null check (origen in ('sintonia', 'inmersion', 'manual')),
    mes_lunar text not null, -- formato 'YYYY-MM'
    emitido_at timestamptz not null default now(),
    canjeado_at timestamptz,
    canjeado_item_kind text check (canjeado_item_kind in ('codice', 'meditacion')),
    canjeado_item_id text
);

CREATE INDEX IF NOT EXISTS idx_cristales_user_disponibles
    ON public.cristales_extraccion (clerk_user_id, tipo)
    WHERE canjeado_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cristales_user_mes_origen
    ON public.cristales_extraccion (clerk_user_id, mes_lunar, origen);

ALTER TABLE public.cristales_extraccion ENABLE ROW LEVEL SECURITY;
-- Sin policies: tabla cerrada por default, acceso solo vía RPCs.

-- ─────────────────────────────────────────────────────────────────
-- RPC: get_my_cristales
-- Devuelve cuántos cristales disponibles tiene el Tripulante por tipo.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_cristales(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_codice_count int := 0;
    v_meditacion_count int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object(
            'codice_count', 0,
            'meditacion_count', 0
        );
    END IF;

    SELECT count(*)::int INTO v_codice_count
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_clerk_user_id
      AND tipo = 'codice'
      AND canjeado_at IS NULL;

    SELECT count(*)::int INTO v_meditacion_count
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_clerk_user_id
      AND tipo = 'meditacion'
      AND canjeado_at IS NULL;

    RETURN json_build_object(
        'codice_count', v_codice_count,
        'meditacion_count', v_meditacion_count
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_my_cristales(text) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- RPC: canjear_cristal
-- Toma el cristal más antiguo disponible del tipo solicitado y lo
-- marca como canjeado contra un item_id (book_id o meditacion_id).
-- Idempotente por construcción: no permite canjear el mismo item
-- dos veces si ya hay un cristal canjeado contra ese item_id.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.canjear_cristal(
    p_clerk_user_id text,
    p_tipo text,
    p_item_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cristal_id uuid;
    v_already_redeemed int;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_tipo NOT IN ('codice', 'meditacion') THEN
        RETURN json_build_object('success', false, 'error', 'tipo inválido');
    END IF;
    IF p_item_id IS NULL OR p_item_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'item_id requerido');
    END IF;

    -- Idempotencia: si ya hay un cristal canjeado de este tipo
    -- contra este item_id, devolvemos éxito sin crear uno nuevo.
    SELECT count(*)::int INTO v_already_redeemed
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_clerk_user_id
      AND canjeado_item_kind = p_tipo
      AND canjeado_item_id = p_item_id;

    IF v_already_redeemed > 0 THEN
        RETURN json_build_object(
            'success', true,
            'already_redeemed', true,
            'item_id', p_item_id
        );
    END IF;

    -- Tomar el cristal más antiguo del tipo solicitado.
    SELECT id INTO v_cristal_id
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_clerk_user_id
      AND tipo = p_tipo
      AND canjeado_at IS NULL
    ORDER BY emitido_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_cristal_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'sin_cristales_disponibles'
        );
    END IF;

    UPDATE public.cristales_extraccion
    SET canjeado_at = now(),
        canjeado_item_kind = p_tipo,
        canjeado_item_id = p_item_id
    WHERE id = v_cristal_id;

    RETURN json_build_object(
        'success', true,
        'already_redeemed', false,
        'cristal_id', v_cristal_id,
        'item_id', p_item_id
    );
END $$;

GRANT EXECUTE ON FUNCTION public.canjear_cristal(text, text, text) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- RPC: emit_cristales_for_subscription
-- Emite 2 cristales (1 de codice + 1 de meditacion) para el
-- Tripulante en el mes_lunar dado. Idempotente: si ya hay cristales
-- para (clerk_user_id, mes_lunar, origen), no crea duplicados.
-- Llamado desde stripe-webhook al confirmarse pago de suscripción.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emit_cristales_for_subscription(
    p_clerk_user_id text,
    p_origen text,
    p_mes_lunar text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_already_emitted int;
    v_mes text;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'clerk_user_id requerido',
            'emitted', 0
        );
    END IF;
    IF p_origen NOT IN ('sintonia', 'inmersion', 'manual') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'origen inválido',
            'emitted', 0
        );
    END IF;

    v_mes := COALESCE(NULLIF(p_mes_lunar, ''), to_char(now(), 'YYYY-MM'));

    -- Idempotencia: si ya hay cristales emitidos para este user +
    -- mes_lunar + origen, no creamos duplicados (una renovación que
    -- caiga en el mismo mes_lunar no entrega cristales extra).
    SELECT count(*)::int INTO v_already_emitted
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_clerk_user_id
      AND mes_lunar = v_mes
      AND origen = p_origen;

    IF v_already_emitted > 0 THEN
        RETURN json_build_object(
            'success', true,
            'already_emitted', true,
            'count', v_already_emitted,
            'emitted', 0,
            'mes_lunar', v_mes
        );
    END IF;

    -- Emite 1 cristal de codice + 1 de meditacion.
    INSERT INTO public.cristales_extraccion
        (clerk_user_id, tipo, origen, mes_lunar)
    VALUES
        (p_clerk_user_id, 'codice', p_origen, v_mes),
        (p_clerk_user_id, 'meditacion', p_origen, v_mes);

    RETURN json_build_object(
        'success', true,
        'already_emitted', false,
        'emitted', 2,
        'mes_lunar', v_mes
    );
END $$;

GRANT EXECUTE ON FUNCTION public.emit_cristales_for_subscription(text, text, text)
    TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- RPC: backfill_cristales_active_subscriptions
-- Helper one-shot: emite cristales del mes en curso para todos los
-- Tripulantes con suscripción activa (sintonia / cuasar / pulsar).
-- Idempotente — si ya tenían cristales este mes, no duplica.
-- Devuelve un sumario {processed: N, emitted_pairs: M}.
--
-- Cómo usarlo: Diego corre `select * from
-- public.backfill_cristales_active_subscriptions();` desde el SQL
-- Editor de Supabase Dashboard cada vez que active el sistema o
-- recupere usuarios huérfanos. Después de eso, el flujo automático
-- (stripe-webhook) cubre las renovaciones.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.backfill_cristales_active_subscriptions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_processed int := 0;
    v_emitted_pairs int := 0;
    v_mes text := to_char(now(), 'YYYY-MM');
    v_row record;
    v_origen text;
    v_emit_result json;
BEGIN
    FOR v_row IN
        SELECT DISTINCT
            p.clerk_user_id,
            s.group_name
        FROM public.subscriptions s
        JOIN public.profiles p ON p.id = s.user_id
        WHERE s.status IN ('active', 'trialing')
          AND p.clerk_user_id IS NOT NULL
          AND p.clerk_user_id <> ''
          AND s.group_name IN ('sintonia', 'cuasar', 'pulsar', 'inmersion')
    LOOP
        v_processed := v_processed + 1;
        v_origen := CASE
            WHEN v_row.group_name = 'sintonia' THEN 'sintonia'
            ELSE 'inmersion'
        END;

        v_emit_result := public.emit_cristales_for_subscription(
            v_row.clerk_user_id,
            v_origen,
            v_mes
        );

        IF (v_emit_result->>'emitted')::int > 0 THEN
            v_emitted_pairs := v_emitted_pairs + 1;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'processed', v_processed,
        'emitted_pairs', v_emitted_pairs,
        'mes_lunar', v_mes
    );
END $$;

GRANT EXECUTE ON FUNCTION public.backfill_cristales_active_subscriptions()
    TO authenticated, service_role;
