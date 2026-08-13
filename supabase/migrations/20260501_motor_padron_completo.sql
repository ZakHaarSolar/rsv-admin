-- Red Solar Viva · Motor de Intervención v3.20 — fix padrón completo
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- v2 (2026-05-01): se agrega DROP FUNCTION IF EXISTS antes del CREATE
-- OR REPLACE. Postgres no permite alterar el RETURNS TABLE de una
-- función existente sin recrearla — la versión previa devolvía 7
-- columnas y esta v3 suma `email` (8 columnas), así que el dashboard
-- tiraba ERROR 42P13 ("cannot change return type of existing
-- function"). Con el DROP la función se recrea limpia y vuelve a
-- otorgar los grants al final.
--
-- Bug encontrado al revisar el padrón: tripulantes recién registrados
-- (Bores, Martin) que entraron al sitio y picaron el Escáner sin
-- completar ninguna sonda quedaban INVISIBLES en Nodos Activos.
--
-- Causa: la versión previa de `get_profiles_no_scan` excluía profiles
-- con CUALQUIER row en `sonda_progress` — pensando que el otro RPC
-- (`get_tripulantes_scan_activity`) los traería. Pero ese RPC sólo
-- lista profiles con rows en `scan_vibracional` (sondas COMPLETAS).
-- Resultado: el padrón perdía a quienes apenas estaban arrancando.
--
-- Fix: relajar la exclusión a sólo `scan_vibracional`. Si un profile
-- tiene sonda_progress sin scan_vibracional, ahora aparece en
-- `get_profiles_no_scan` (con scan_count=0, complete_cycles=0). Si
-- aparece simultáneamente en `get_tripulantes_scan_activity`, el
-- frontend dedupe por clerk_user_id (rowsWith ganan).
--
-- También sumamos `email` al return — útil para el modal del Motor
-- que ahora puede mostrar email del Tripulante recién registrado sin
-- esperar a get_tripulante_extras.

DROP FUNCTION IF EXISTS public.get_profiles_no_scan(TEXT);

CREATE OR REPLACE FUNCTION public.get_profiles_no_scan(
    p_admin_clerk_id TEXT
)
RETURNS TABLE (
    clerk_user_id     TEXT,
    full_name         TEXT,
    email             TEXT,
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
        COALESCE(p.email, '')::TEXT           AS email,
        0::INT                                AS scan_count,
        0::INT                                AS complete_cycles,
        NULL::TIMESTAMPTZ                     AS last_scan_ts,
        '[]'::JSONB                           AS history,
        COALESCE(
            ARRAY(
                SELECT DISTINCT sp.pilar
                FROM sonda_progress sp
                WHERE sp.clerk_user_id = p.clerk_user_id
            ),
            ARRAY[]::TEXT[]
        )                                     AS in_flight_pilars
    FROM profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND p.clerk_user_id <> ''
      /* Excluye SÓLO los que tienen rows en scan_vibracional
         (sondas completas). Profiles con sonda_progress pero sin
         scan_vibracional ahora SÍ aparecen — antes quedaban
         atrapados en un limbo invisible al admin. */
      AND NOT EXISTS (
          SELECT 1 FROM scan_vibracional sv
          WHERE sv.clerk_user_id = p.clerk_user_id
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_no_scan(TEXT)
    TO anon, authenticated;
