-- Red Solar Viva · REALIDAD ELEGIDA — Fotones de la Contemplación BLINDADOS
-- =====================================================================
-- 20260712c_realidad_contemplacion_grant.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action v1.37 (+ grant_contemplacion_bonus) + EV_RealidadElegida
-- v1.1 (el cliente deja de usar toggle_ritual con guard de localStorage).
--
-- Por qué: la Contemplación acreditaba Fotones vía toggle_ritual con un
-- guard en localStorage → frágil (otro dispositivo / re-anclar / limpiar
-- storage podía duplicar, y una 2ª llamada del toggle podía QUITAR los
-- Fotones del día). Ahora el premio es una RPC GRANT idempotente por día
-- (patrón grant_sendero_bonus / grant_plan_vuelo_bonus): un solo premio al
-- día sin importar cuántas veces se contemple o re-ancle, NUNCA resta, y
-- devuelve granted + points para que el cliente muestre la animación de
-- Fotones solo cuando de verdad se acreditaron.
--
-- Los puntos salen del catálogo 'contemplacion_realidad' (editable en
-- Motor → Rituales; fallback 10).

CREATE OR REPLACE FUNCTION public.grant_contemplacion_bonus(p_clerk_user_id text)
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

REVOKE EXECUTE ON FUNCTION public.grant_contemplacion_bonus(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_contemplacion_bonus(text) TO service_role;

NOTIFY pgrst, 'reload schema';
