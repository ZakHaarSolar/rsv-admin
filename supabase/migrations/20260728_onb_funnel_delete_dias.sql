-- Red Solar Viva · EMBUDO DEL ONBOARDING · borrar 1, 2 y 3 días (2026-07-28)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Requiere 20260713_onb_funnel.sql + 20260713c_onb_funnel_delete.sql.
--
-- Zak: recorrer el onboarding varias veces deja pruebas de días anteriores
-- y el borrado solo alcanzaba 12h atrás (el tope duro de la RPC era 24h).
-- Este parche sube el tope a 72h (3 días) SIN cambiar la firma ni el gate
-- admin: el panel del Motor ya manda 24/48/72 y muestra la ventana que el
-- server informa de vuelta.
--
-- Sigue filtrando por started_at (cuando la instalacion aparecio por
-- primera vez): borra instalaciones nacidas dentro de la ventana, que es
-- justo lo que genera una prueba propia.

CREATE OR REPLACE FUNCTION public.delete_onb_funnel_recent(
    p_admin_clerk_id text,
    p_hours int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
    v_deleted int;
    v_hours int;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    /* Tope de seguridad: ventanas de 1h a 72h (3 dias). */
    v_hours := LEAST(GREATEST(COALESCE(p_hours, 1), 1), 72);

    DELETE FROM public.onb_funnel
    WHERE started_at > now() - make_interval(hours => v_hours);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN json_build_object('deleted', v_deleted, 'hours', v_hours);
END $$;

-- Re-afirmar el candado (un CREATE OR REPLACE re-otorga a PUBLIC).
REVOKE ALL ON FUNCTION public.delete_onb_funnel_recent(text, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_onb_funnel_recent(text, int)
    TO service_role;

NOTIFY pgrst, 'reload schema';
