-- 20261008_sin_conexion_fechas.sql · 🜂 LO HECHO SIN INTERNET CUENTA EL DÍA EN QUE SE HIZO
-- (Zak 2026-10-08: la app se usa sin conexión y se sincroniza al volver la red).
-- ─────────────────────────────────────────────────────────────────────────────
-- La app anota en el teléfono lo que el Tripulante hace sin red y lo sube al
-- volver la conexión, a veces horas después (lib/sinConexion). Estas funciones
-- usaban SIEMPRE el "ahora" del servidor, así que lo hecho anoche sin red caía
-- hoy: el bono del Sendero completo se acreditaba al día equivocado (y bloqueaba
-- el de hoy) y un reinicio de racha arrancaba el conteo a la hora de subir.
--
-- Cada una gana un parámetro OPCIONAL con la fecha real (la app solo lo manda
-- en lo que sube tarde; sin él, todo funciona exactamente igual que antes):
--   · grant_sendero_bonus / grant_plan_vuelo_bonus / grant_contemplacion_bonus
--     + p_date date  → el día del bono (solo hoy o hasta 7 días atrás).
--   · reset_racha / toggle_racha_pause
--     + p_at timestamptz → el instante real (nunca en el futuro ni antes de que
--     empezara el tramo).
-- toggle_ritual ya aceptaba p_date: no se toca.
--
-- Se borra la firma vieja antes de crear la nueva (dos firmas con el mismo
-- nombre harían ambigua la llamada sin el parámetro nuevo). Todo en una
-- transacción. Idempotente: se puede volver a correr.

BEGIN;

-- ── Bono del Sendero completo ────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.grant_sendero_bonus(text);
DROP FUNCTION IF EXISTS public.grant_sendero_bonus(text, date);
CREATE FUNCTION public.grant_sendero_bonus(p_clerk_user_id text, p_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_hoy     date := (now() AT TIME ZONE 'America/Cancun')::date;
    d_today   date := CASE
                          WHEN p_date IS NOT NULL AND p_date <= d_hoy AND p_date >= d_hoy - 7
                          THEN p_date ELSE d_hoy END;
    v_granted boolean := false;
    v_today   int := 0;
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('granted', false);
    END IF;

    WITH ins AS (
        INSERT INTO public.daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
        VALUES (p_clerk_user_id, 'sendero_bonus', d_today, 10, NULL)
        ON CONFLICT (clerk_user_id, activity_key, checkin_date) DO NOTHING
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM ins) INTO v_granted;

    SELECT COALESCE(SUM(points), 0)::int INTO v_today
    FROM public.daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d_today;

    SELECT COALESCE(SUM(points), 0)::int INTO v_total
    FROM public.daily_checkins
    WHERE clerk_user_id = p_clerk_user_id;

    RETURN json_build_object(
        'granted', v_granted,
        'today_fotones', v_today,
        'total_fotones', v_total
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.grant_sendero_bonus(text, date) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_sendero_bonus(text, date) TO service_role;

-- ── Bono del Plan de Vuelo completo ──────────────────────────────────────────
DROP FUNCTION IF EXISTS public.grant_plan_vuelo_bonus(text);
DROP FUNCTION IF EXISTS public.grant_plan_vuelo_bonus(text, date);
CREATE FUNCTION public.grant_plan_vuelo_bonus(p_clerk_user_id text, p_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_hoy     date := (now() AT TIME ZONE 'America/Cancun')::date;
    d_today   date := CASE
                          WHEN p_date IS NOT NULL AND p_date <= d_hoy AND p_date >= d_hoy - 7
                          THEN p_date ELSE d_hoy END;
    v_points  int;
    v_granted boolean := false;
    v_today   int := 0;
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('granted', false);
    END IF;

    SELECT points INTO v_points
    FROM public.daily_ritual_catalog
    WHERE activity_key = 'plan_vuelo' AND active
    LIMIT 1;
    v_points := COALESCE(v_points, 15);

    WITH ins AS (
        INSERT INTO public.daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
        VALUES (p_clerk_user_id, 'plan_vuelo', d_today, v_points, NULL)
        ON CONFLICT (clerk_user_id, activity_key, checkin_date) DO NOTHING
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM ins) INTO v_granted;

    SELECT COALESCE(SUM(points), 0)::int INTO v_today
    FROM public.daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d_today;

    SELECT COALESCE(SUM(points), 0)::int INTO v_total
    FROM public.daily_checkins
    WHERE clerk_user_id = p_clerk_user_id;

    RETURN json_build_object(
        'granted',       v_granted,
        'today_fotones', v_today,
        'total_fotones', v_total
    );
END $$;

REVOKE ALL ON FUNCTION public.grant_plan_vuelo_bonus(text, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_plan_vuelo_bonus(text, date) TO service_role;

-- ── Bono de la Contemplación (Realidad Elegida) ─────────────────────────────
DROP FUNCTION IF EXISTS public.grant_contemplacion_bonus(text);
DROP FUNCTION IF EXISTS public.grant_contemplacion_bonus(text, date);
CREATE FUNCTION public.grant_contemplacion_bonus(p_clerk_user_id text, p_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_hoy     date := (now() AT TIME ZONE 'America/Cancun')::date;
    d_today   date := CASE
                          WHEN p_date IS NOT NULL AND p_date <= d_hoy AND p_date >= d_hoy - 7
                          THEN p_date ELSE d_hoy END;
    v_points  int;
    v_granted boolean := false;
    v_today   int := 0;
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('granted', false);
    END IF;

    SELECT points INTO v_points
    FROM public.daily_ritual_catalog
    WHERE activity_key = 'contemplacion_realidad' AND active
    LIMIT 1;
    v_points := COALESCE(v_points, 10);

    WITH ins AS (
        INSERT INTO public.daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
        VALUES (p_clerk_user_id, 'contemplacion_realidad', d_today, v_points, NULL)
        ON CONFLICT (clerk_user_id, activity_key, checkin_date) DO NOTHING
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM ins) INTO v_granted;

    SELECT COALESCE(SUM(points), 0)::int INTO v_today
    FROM public.daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d_today;

    SELECT COALESCE(SUM(points), 0)::int INTO v_total
    FROM public.daily_checkins
    WHERE clerk_user_id = p_clerk_user_id;

    RETURN json_build_object(
        'granted',       v_granted,
        'points',        v_points,
        'today_fotones', v_today,
        'total_fotones', v_total
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.grant_contemplacion_bonus(text, date) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_contemplacion_bonus(text, date) TO service_role;

-- ── Reiniciar una racha ──────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.reset_racha(text, uuid);
DROP FUNCTION IF EXISTS public.reset_racha(text, uuid, timestamptz);
CREATE FUNCTION public.reset_racha(
    p_clerk_user_id text,
    p_racha_id      uuid,
    p_at            timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old     public.rachas;
    v_ahora   timestamptz;
    v_end     timestamptz;
    v_elapsed bigint;
    v_hist    jsonb;
    v_row     public.rachas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT * INTO v_old
    FROM public.rachas
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    -- El instante real (lo hecho sin red llega tarde): nunca en el futuro ni
    -- antes de que empezara el tramo.
    v_ahora := GREATEST(LEAST(COALESCE(p_at, now()), now()), v_old.started_at);

    -- Si estaba pausada, el tramo se cierra en paused_at (no cuenta la pausa).
    v_end     := COALESCE(v_old.paused_at, v_ahora);
    v_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (v_end - v_old.started_at)))::bigint;
    v_hist    := COALESCE(v_old.history, '[]'::jsonb);

    -- Solo archivamos tramos con vida real (evita basura de resets instantáneos).
    IF v_elapsed > 0 THEN
        v_hist := v_hist || jsonb_build_object(
            's',   v_old.started_at,
            'e',   v_end,
            'sec', v_elapsed
        );
        -- Cap: conservar los 300 tramos más recientes.
        WHILE jsonb_array_length(v_hist) > 300 LOOP
            v_hist := v_hist - 0;
        END LOOP;
    END IF;

    UPDATE public.rachas SET
        best_seconds = GREATEST(best_seconds, v_elapsed),
        history      = v_hist,
        started_at   = v_ahora,
        paused_at    = NULL,
        updated_at   = now()
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

REVOKE ALL ON FUNCTION public.reset_racha(text, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_racha(text, uuid, timestamptz) TO service_role;

-- ── Pausar / reanudar una racha ──────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.toggle_racha_pause(text, uuid);
DROP FUNCTION IF EXISTS public.toggle_racha_pause(text, uuid, timestamptz);
CREATE FUNCTION public.toggle_racha_pause(
    p_clerk_user_id text,
    p_racha_id      uuid,
    p_at            timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old     public.rachas;
    v_ahora   timestamptz;
    v_elapsed bigint;
    v_hist    jsonb;
    v_row     public.rachas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT * INTO v_old
    FROM public.rachas
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    -- El instante real: nunca en el futuro ni antes del último cambio.
    v_ahora := GREATEST(
        LEAST(COALESCE(p_at, now()), now()),
        COALESCE(v_old.paused_at, v_old.started_at)
    );

    IF v_old.paused_at IS NULL THEN
        -- ── PAUSAR: cierra el tramo vivo, lo archiva, conteo a cero, standby.
        v_elapsed := GREATEST(
            0,
            EXTRACT(EPOCH FROM (v_ahora - v_old.started_at))
        )::bigint;
        v_hist := COALESCE(v_old.history, '[]'::jsonb);

        -- Solo archivamos tramos con vida real (evita basura de pausas instantáneas).
        IF v_elapsed > 0 THEN
            v_hist := v_hist || jsonb_build_object(
                's',   v_old.started_at,
                'e',   v_ahora,
                'sec', v_elapsed
            );
            -- Cap: conservar los 300 tramos más recientes.
            WHILE jsonb_array_length(v_hist) > 300 LOOP
                v_hist := v_hist - 0;
            END LOOP;
        END IF;

        -- started_at = paused_at → el conteo efectivo queda en 0 y congelado
        -- ahí mientras dure la pausa (no acumula días).
        UPDATE public.rachas SET
            best_seconds = GREATEST(best_seconds, v_elapsed),
            history      = v_hist,
            started_at   = v_ahora,
            paused_at    = v_ahora,
            updated_at   = now()
        WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
    ELSE
        -- ── REANUDAR: arranca de cero desde ese instante.
        UPDATE public.rachas SET
            started_at = v_ahora,
            paused_at  = NULL,
            updated_at = now()
        WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
    END IF;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

REVOKE ALL ON FUNCTION public.toggle_racha_pause(text, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_racha_pause(text, uuid, timestamptz) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
