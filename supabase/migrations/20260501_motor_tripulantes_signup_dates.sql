-- Red Solar Viva · Motor de Intervención · filtro Antigüedad
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Crea una RPC SECURITY DEFINER que devuelve la fecha de creación de
-- cada profile (de toda la red). El Motor de Intervención la consume
-- en paralelo a get_tripulantes_scan_activity / get_profiles_no_scan
-- y la usa para ordenar la grilla de Nodos Activos por antigüedad
-- ("Más nuevos" o "Más antiguos").
--
-- Bypassa RLS de profiles vía SECURITY DEFINER. Admin gate igual al
-- resto de RPCs del Motor (alias `ap` para evitar choque con
-- RETURNS TABLE).
--
-- El frontend hidrata un Map<clerk_user_id, profile_created_at> con
-- esta RPC y lo aplica en el sort sin tener que hacer N requests.

DROP FUNCTION IF EXISTS public.get_tripulantes_signup_dates(TEXT);

CREATE OR REPLACE FUNCTION public.get_tripulantes_signup_dates(
    p_admin_clerk_id TEXT
)
RETURNS TABLE (
    clerk_user_id        TEXT,
    profile_created_at   TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        p.clerk_user_id::TEXT     AS clerk_user_id,
        p.created_at              AS profile_created_at
    FROM profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND p.clerk_user_id <> '';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tripulantes_signup_dates(TEXT)
    TO anon, authenticated;
