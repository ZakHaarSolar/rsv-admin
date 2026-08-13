-- 20260713_plan_vuelo_limits.sql
-- Ajuste de topes del Plan de Vuelo (feedback de Zak):
--   • Freemium (sin Sintonía): 5 misiones/día → "vistazo" del Plan de Vuelo.
--   • Sintonía Solar: 20 misiones/día (antes 40).
-- Solo cambian los dos IF de cap; el resto de upsert_day_task queda idéntico
-- a 20260712_plan_vuelo.sql. Idempotente (CREATE OR REPLACE).

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
