-- Red Solar Viva · SENDERO DE LUZ · Bono +10 por completar TODO el sendero del día
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Además: agregar `grant_sendero_bonus` al gateway user-action y redeploy
-- (admin/supabase/functions/user-action/index.ts ya lo incluye en este commit).
--
-- Idempotente: UN bono por día (PK clerk_user_id+activity_key+checkin_date).
-- Se inserta como un check-in normal de HOY ('sendero_bonus', 10 pts) → aparece
-- en "Hoy" y se acredita al Total MAÑANA, igual que el resto de los Fotones del
-- día (mecánica de maestría: hoy no cuenta al Total hasta cerrar el día). El
-- cliente lo llama cuando se completan TODOS los rituales activos del día.

CREATE OR REPLACE FUNCTION public.grant_sendero_bonus(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today   date := (now() AT TIME ZONE 'America/Cancun')::date;
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

REVOKE EXECUTE ON FUNCTION public.grant_sendero_bonus(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_sendero_bonus(text) TO service_role;

NOTIFY pgrst, 'reload schema';
