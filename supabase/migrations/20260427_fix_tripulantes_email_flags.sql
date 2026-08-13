-- Red Solar Viva · Fix get_tripulantes_email_flags (42702 ambiguous)
-- =====================================================================
-- La función original tenía RETURNS TABLE(clerk_user_id TEXT, in_nodo
-- BOOLEAN, has_opt_out BOOLEAN). Esos nombres se vuelven variables de
-- salida PL/pgSQL automáticamente. Cuando Postgres ejecuta el SELECT
-- interno se topa con `clerk_user_id` dentro del WHERE/EXISTS y no
-- sabe si referirse a la variable PL/pgSQL o a la columna real de
-- profiles → error 42702 "column reference \"clerk_user_id\" is
-- ambiguous". Síntoma: el RPC retorna 400 y el frontend cachea como
-- 0 rows, los filtros del Motor de Intervención (Suscritos / Dados de
-- baja) no encuentran tripulantes pese a que la tabla nodo_central
-- tiene rows.
--
-- Fix limpio: directiva #variable_conflict use_column al inicio del
-- body. Le dice a Postgres que en cualquier conflicto prefiera la
-- COLUMNA sobre la variable PL/pgSQL. Sin renombrar nada — el
-- frontend sigue leyendo clerk_user_id / in_nodo / has_opt_out
-- intactos.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

DROP FUNCTION IF EXISTS public.get_tripulantes_email_flags(TEXT);

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
#variable_conflict use_column
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.clerk_user_id = p_admin_clerk_id
          AND p.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        p.clerk_user_id::TEXT,
        EXISTS(
            SELECT 1 FROM public.nodo_central nc
            WHERE nc.email = LOWER(TRIM(p.email))
        ),
        EXISTS(
            SELECT 1 FROM public.email_opt_outs eo
            WHERE eo.email = LOWER(TRIM(p.email))
        )
    FROM public.profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND p.email IS NOT NULL
      AND TRIM(p.email) <> '';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tripulantes_email_flags(TEXT)
    TO anon, authenticated;
