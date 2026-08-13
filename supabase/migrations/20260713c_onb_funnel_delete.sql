-- Red Solar Viva · EMBUDO DEL ONBOARDING · borrado por ventana (2026-07-13 · III)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Requiere 20260713_onb_funnel.sql.
--
-- Borra los registros del embudo de las ULTIMAS N horas (1/3/6/12) para
-- limpiar la data de pruebas propias (ej. Zak recorriendo el onboarding).
-- Filtra por started_at (cuando la instalacion aparecio por primera vez) —
-- las instalaciones de prueba recien creadas caen dentro de la ventana.
-- Admin-gated (via gateway admin-action). Devuelve cuantas filas borro.

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

    /* Tope de seguridad: solo ventanas cortas (1..24h). */
    v_hours := LEAST(GREATEST(COALESCE(p_hours, 1), 1), 24);

    DELETE FROM public.onb_funnel
    WHERE started_at > now() - make_interval(hours => v_hours);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN json_build_object('deleted', v_deleted, 'hours', v_hours);
END $$;

REVOKE ALL ON FUNCTION public.delete_onb_funnel_recent(text, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_onb_funnel_recent(text, int)
    TO service_role;

NOTIFY pgrst, 'reload schema';
