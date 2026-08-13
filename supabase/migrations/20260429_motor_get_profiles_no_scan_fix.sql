-- Red Solar Viva · Motor de Intervención v3.19 — fix get_profiles_no_scan
-- =====================================================================
-- La versión que se aplicó el 2026-04-29 desde el SQL Editor tiraba
-- HTTP 400 en runtime con:
--   { "code": "42702",
--     "message": "column reference \"clerk_user_id\" is ambiguous" }
-- porque el nombre `clerk_user_id` aparece tanto como columna del
-- RETURNS TABLE (variable OUT de PL/pgSQL) como columna de la tabla
-- `profiles` referenciada en el admin gate y en el WHERE final. Sin
-- prefijo de tabla y sin la directiva `#variable_conflict use_column`,
-- el planner no podía resolver a cuál se refería.
--
-- Dos cambios:
--   1. Directiva `#variable_conflict use_column` al inicio del body
--      → cuando hay choque entre variable PL/pgSQL y columna de tabla,
--      gana la columna.
--   2. Alias explícito `ap` en el admin gate y `p` en el SELECT, con
--      todas las referencias a columnas prefijadas. Doble seguridad
--      para que cualquier futura edición no reintroduzca la ambigüedad.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_profiles_no_scan(
    p_admin_clerk_id TEXT
)
RETURNS TABLE (
    clerk_user_id     TEXT,
    full_name         TEXT,
    scan_count        INT,
    complete_cycles   INT,
    last_scan_ts      TIMESTAMPTZ,
    history           JSONB,
    in_flight_pilars  TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
    /* Admin gate (alias `ap` para evitar choque con RETURNS TABLE). */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        p.clerk_user_id::TEXT                 AS clerk_user_id,
        COALESCE(p.full_name, '')::TEXT       AS full_name,
        0::INT                                AS scan_count,
        0::INT                                AS complete_cycles,
        NULL::TIMESTAMPTZ                     AS last_scan_ts,
        '[]'::JSONB                           AS history,
        ARRAY[]::TEXT[]                       AS in_flight_pilars
    FROM profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND p.clerk_user_id <> ''
      /* Excluye los que ya aparecen en get_tripulantes_scan_activity
         (cualquier scan o sonda en progreso). El cliente luego junta
         ambas listas sin duplicados. */
      AND NOT EXISTS (
          SELECT 1 FROM scan_vibracional sv
          WHERE sv.clerk_user_id = p.clerk_user_id
      )
      AND NOT EXISTS (
          SELECT 1 FROM sonda_progress sp
          WHERE sp.clerk_user_id = p.clerk_user_id
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_no_scan(TEXT)
    TO anon, authenticated;
