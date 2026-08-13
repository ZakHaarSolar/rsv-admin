-- Red Solar Viva · PLAN DE VUELO — capa de tareas del día del Escáner
-- =====================================================================
-- 20260712_plan_vuelo.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action (suma get_my_day_tasks / upsert_day_task /
-- toggle_day_task / move_day_task / delete_day_task / reorder_day_tasks /
-- grant_plan_vuelo_bonus al whitelist) + EV_PlanVuelo.tsx (capa nueva del
-- Radar en escaner-app).
--
-- Qué es: las MISIONES específicas de HOY (lo que Aqua escribe y palomea a
-- diario) — la contraparte one-off del Sendero de Luz (rituales
-- recurrentes). Cada misión tiene una FECHA; "Hoy" = query por fecha. Se
-- puede programar para días futuros (Ruta de la Semana) → ese día aparece
-- en Hoy, sin cron.
--
-- Freemium (server-side, la verdad vive aquí; el cliente solo pre-gatea):
--   · SIN membresía → solo misiones de HOY, sin vectores primarios, hasta
--     10 misiones/día.
--   · Con Sintonía/Inmersión activa (_is_active_member) → Ruta de la Semana
--     (programar futuro), vectores primarios y hasta 40 misiones/día.
--
-- FOTONES (regla de oro — NUNCA por misión): completar el Plan de Vuelo del
-- día otorga UN bono FIJO diario vía grant_plan_vuelo_bonus (idempotente por
-- día, lee los puntos del catálogo 'plan_vuelo' → editable desde Motor →
-- Rituales; nunca resta). El cliente lo llama cuando se completan TODAS las
-- misiones del día.
--
-- Tabla RLS-locked SIN policies → solo accesible vía las RPCs SECURITY
-- DEFINER, ruteadas por el gateway user-action (inyecta el p_clerk_user_id
-- verificado del token; el del cliente se descarta).

CREATE TABLE IF NOT EXISTS public.day_tasks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    title         text NOT NULL DEFAULT '',
    task_date     date NOT NULL,
    done_at       timestamptz,               -- NULL = pendiente; fecha = sellada
    pilar         text NOT NULL DEFAULT '',   -- '' | fisico|mental|emocional|financiero|vector|orbita
    is_primary    boolean NOT NULL DEFAULT false,
    sort_order    int NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_day_tasks_user_date
    ON public.day_tasks (clerk_user_id, task_date);

ALTER TABLE public.day_tasks ENABLE ROW LEVEL SECURITY;
-- (Sin policies → cero acceso anon/authenticated; solo service_role vía RPC.)

-- ── Catálogo del bono de Fotones (editable desde Motor → Rituales) ──
INSERT INTO public.daily_ritual_catalog
    (activity_key, label, points, requires_text, active, sort_order)
VALUES
    ('plan_vuelo', 'Plan de Vuelo', 15, false, true, 110)
ON CONFLICT (activity_key) DO NOTHING;

-- ── Helper interno: fila → json (una sola forma en todas las RPCs) ──
CREATE OR REPLACE FUNCTION public._day_task_to_json(t public.day_tasks)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',         t.id,
        'title',      t.title,
        'task_date',  t.task_date,
        'done_at',    t.done_at,
        'pilar',      t.pilar,
        'is_primary', t.is_primary,
        'sort_order', t.sort_order,
        'created_at', t.created_at
    );
$$;

-- ── Lectura: mis misiones en un rango de fechas + membresía ─────────
CREATE OR REPLACE FUNCTION public.get_my_day_tasks(
    p_clerk_user_id text,
    p_from          date,
    p_to            date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member boolean;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    v_member := public._is_active_member(p_clerk_user_id);
    RETURN json_build_object(
        'is_member',        v_member,
        'free_daily_limit', 10,
        'member_daily_limit', 40,
        'tasks', COALESCE((
            SELECT json_agg(public._day_task_to_json(t)
                            ORDER BY t.task_date,
                                     t.is_primary DESC,
                                     t.sort_order,
                                     t.created_at)
            FROM public.day_tasks t
            WHERE t.clerk_user_id = p_clerk_user_id
              AND t.task_date >= p_from
              AND t.task_date <= p_to
        ), '[]'::json)
    );
END $$;

-- ── Crear / editar una misión ───────────────────────────────────────
-- p_id NULL o inexistente → INSERT (aplica freemium: hoy-only + sin
-- primario + cap por día para no-miembros). p_id existente → UPDATE.
CREATE OR REPLACE FUNCTION public.upsert_day_task(
    p_clerk_user_id text,
    p_id            uuid,
    p_title         text,
    p_task_date     date,
    p_pilar         text DEFAULT '',
    p_is_primary    boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today   date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_title   text := LEFT(COALESCE(TRIM(p_title), ''), 240);
    v_pilar   text := CASE
                         WHEN COALESCE(p_pilar,'') IN
                             ('fisico','mental','emocional','financiero','vector','orbita')
                         THEN p_pilar ELSE '' END;
    v_date    date := COALESCE(p_task_date, d_today);
    v_member  boolean;
    v_primary boolean;
    v_count   int;
    v_next    int;
    v_exists  boolean := false;
    v_row     public.day_tasks;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF v_title = '' THEN
        RETURN json_build_object('error', 'empty');
    END IF;

    v_member  := public._is_active_member(p_clerk_user_id);
    -- Vector primario = solo miembros (defensivo; el cliente ya lo gatea).
    v_primary := (v_member AND COALESCE(p_is_primary, false));

    IF p_id IS NOT NULL THEN
        SELECT true INTO v_exists
        FROM public.day_tasks
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    END IF;

    IF v_exists THEN
        -- No-miembro no puede reprogramar a futuro; conserva la fecha actual
        -- si intenta mover más allá de hoy.
        IF NOT v_member AND v_date > d_today THEN
            SELECT task_date INTO v_date
            FROM public.day_tasks WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
        END IF;
        UPDATE public.day_tasks SET
            title      = v_title,
            task_date  = v_date,
            pilar      = v_pilar,
            is_primary = v_primary,
            updated_at = now()
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
        RETURN json_build_object('ok', true, 'task', public._day_task_to_json(v_row));
    END IF;

    -- INSERT: no se crea en el pasado.
    IF v_date < d_today THEN v_date := d_today; END IF;
    -- No-miembro: solo HOY (la Ruta de la Semana es de Sintonía).
    IF NOT v_member AND v_date <> d_today THEN
        RETURN json_build_object('error', 'member_only_future');
    END IF;

    -- Cap por día.
    SELECT count(*)::int INTO v_count
    FROM public.day_tasks
    WHERE clerk_user_id = p_clerk_user_id AND task_date = v_date;

    -- Freemium: 5 misiones/día (vistazo). Sintonía: 20 misiones/día.
    IF NOT v_member AND v_count >= 5 THEN
        RETURN json_build_object('error', 'limit_free');
    END IF;
    IF v_count >= 20 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    SELECT COALESCE(MAX(sort_order), 0) + 10 INTO v_next
    FROM public.day_tasks
    WHERE clerk_user_id = p_clerk_user_id AND task_date = v_date;

    INSERT INTO public.day_tasks
        (clerk_user_id, title, task_date, pilar, is_primary, sort_order)
    VALUES
        (p_clerk_user_id, v_title, v_date, v_pilar, v_primary, v_next)
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'task', public._day_task_to_json(v_row));
END $$;

-- ── Sellar / des-sellar una misión ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_day_task(
    p_clerk_user_id text,
    p_id            uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.day_tasks;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    UPDATE public.day_tasks SET
        done_at    = CASE WHEN done_at IS NULL THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = p_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'task', public._day_task_to_json(v_row));
END $$;

-- ── Mover una misión a otra fecha (rollover: a hoy / reprogramar) ────
CREATE OR REPLACE FUNCTION public.move_day_task(
    p_clerk_user_id text,
    p_id            uuid,
    p_task_date     date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today  date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_member boolean;
    v_date   date := COALESCE(p_task_date, d_today);
    v_next   int;
    v_row    public.day_tasks;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    v_member := public._is_active_member(p_clerk_user_id);
    -- No-miembro: solo "Mover a hoy" (reprogramar a futuro es de Sintonía).
    IF NOT v_member AND v_date <> d_today THEN
        RETURN json_build_object('error', 'member_only_future');
    END IF;
    IF v_date < d_today THEN v_date := d_today; END IF;

    SELECT COALESCE(MAX(sort_order), 0) + 10 INTO v_next
    FROM public.day_tasks
    WHERE clerk_user_id = p_clerk_user_id AND task_date = v_date;

    UPDATE public.day_tasks SET
        task_date  = v_date,
        sort_order = v_next,
        updated_at = now()
    WHERE id = p_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'task', public._day_task_to_json(v_row));
END $$;

-- ── Soltar una misión (sin juicio) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_day_task(
    p_clerk_user_id text,
    p_id            uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM public.day_tasks
    WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('ok', true, 'deleted', FOUND);
END $$;

-- ── Reordenar las misiones de un día (arrastre) ─────────────────────
CREATE OR REPLACE FUNCTION public.reorder_day_tasks(
    p_clerk_user_id text,
    p_ids           uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    UPDATE public.day_tasks t SET
        sort_order = o.ord * 10,
        updated_at = now()
    FROM unnest(p_ids) WITH ORDINALITY AS o(id, ord)
    WHERE t.id = o.id AND t.clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('ok', true);
END $$;

-- ── Bono de Fotones por completar el Plan de Vuelo del día ───────────
-- Idempotente (UN bono/día, PK clerk+activity+fecha). Lee los puntos del
-- catálogo 'plan_vuelo' (editable en Motor → Rituales; fallback 15). Nunca
-- resta. Se inserta como check-in de HOY → cuenta al Total MAÑANA como el
-- resto de los Fotones del día (mecánica de maestría). El cliente lo llama
-- cuando se completan TODAS las misiones de hoy.
CREATE OR REPLACE FUNCTION public.grant_plan_vuelo_bonus(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today   date := (now() AT TIME ZONE 'America/Cancun')::date;
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

-- ── Locks (patrón canónico: nada para anon/authenticated; gateway only) ──
REVOKE ALL ON FUNCTION public._day_task_to_json(public.day_tasks)                                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_day_tasks(text, date, date)                                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_day_task(text, uuid, text, date, text, boolean)                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_day_task(text, uuid)                                             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_day_task(text, uuid, date)                                         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_day_task(text, uuid)                                             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reorder_day_tasks(text, uuid[])                                         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_plan_vuelo_bonus(text)                                            FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._day_task_to_json(public.day_tasks)                                   TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_day_tasks(text, date, date)                                    TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_day_task(text, uuid, text, date, text, boolean)                TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_day_task(text, uuid)                                           TO service_role;
GRANT EXECUTE ON FUNCTION public.move_day_task(text, uuid, date)                                       TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_day_task(text, uuid)                                           TO service_role;
GRANT EXECUTE ON FUNCTION public.reorder_day_tasks(text, uuid[])                                       TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_plan_vuelo_bonus(text)                                          TO service_role;

NOTIFY pgrst, 'reload schema';
