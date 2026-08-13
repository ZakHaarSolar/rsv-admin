-- Red Solar Viva · get_tripulantes_email_flags
-- =====================================================================
-- Devuelve flags de Nodo + opt-out por tripulante en una sola llamada.
-- Lo consume el grid del Motor de Intervención para filtrar (suscritos
-- al Nodo, dados de baja, etc).
--
-- Patrón: un solo round-trip por refresh del grid. Para 10K tripulantes
-- la query corre en O(N) sobre profiles y dos joins por exists; índices
-- en email de las dos tablas auxiliares ya están en sus migraciones.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.get_tripulantes_email_flags(
    p_admin_clerk_id TEXT
)
RETURNS TABLE (
    clerk_user_id  TEXT,
    in_nodo        BOOLEAN,
    has_opt_out    BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        p.clerk_user_id::TEXT,
        EXISTS(
            SELECT 1 FROM nodo_central nc
            WHERE nc.email = LOWER(TRIM(p.email))
        ) AS in_nodo,
        EXISTS(
            SELECT 1 FROM email_opt_outs eo
            WHERE eo.email = LOWER(TRIM(p.email))
        ) AS has_opt_out
    FROM profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND p.email IS NOT NULL
      AND p.email <> '';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tripulantes_email_flags(TEXT)
    TO anon, authenticated;
