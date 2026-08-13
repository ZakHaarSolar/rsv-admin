-- Red Solar Viva · FIX RAÍZ — "Decodificador de Materia atorado en decodificando"
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- BUG (raíz, hallado 2026-06-25): get_matter_job y get_my_matter_records
-- declaran una VARIABLE plpgsql llamada `result` Y leen la COLUMNA `result`
-- (el dictamen) de matter_jobs en el mismo SELECT. PL/pgSQL no sabe si `result`
-- es la variable o la columna → conflicto de nombre (plpgsql.variable_conflict
-- por defecto = error → 42702 "column reference \"result\" is ambiguous"). La
-- función falla en cada llamada → el cliente NUNCA recibe el dictamen → la
-- animación "decodificando" se queda pegada aunque el job esté 'done', y la
-- Bóveda sale vacía. (complete_matter_job NO se afecta: es un UPDATE, su
-- `result = p_result` es inequívocamente la columna.)
--
-- Por qué Sueños SÍ funciona y Materia no: dream_records NO tiene una columna
-- llamada `result` (el dictamen vive en dictamen_vibral / calibracion_quirurgica)
-- → la variable `result` de get_dream_job es inequívoca. Materia sí la tiene.
--
-- FIX: renombrar la variable a `v_out` (sin colisión). Cero cambios de firma,
-- de permisos ni de comportamiento — solo el nombre de la variable interna.

-- ── get_matter_job — el cliente poolea UN job por id ───────────────────
CREATE OR REPLACE FUNCTION get_matter_job(
    target_clerk_id TEXT,
    p_record_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_out json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3
       OR p_record_id IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT row_to_json(r) INTO v_out
    FROM (
        SELECT id, created_at, status, result, input_label
        FROM matter_jobs
        WHERE id = p_record_id AND clerk_user_id = target_clerk_id
        LIMIT 1
    ) r;
    RETURN v_out;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) TO service_role;

-- ── get_my_matter_records — la GALERÍA (Bóveda, solo 'done') ───────────
CREATE OR REPLACE FUNCTION get_my_matter_records(
    target_clerk_id TEXT,
    p_limit INT DEFAULT 200
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_out json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN '[]'::json;
    END IF;
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO v_out
    FROM (
        SELECT id, created_at, input_label, result
        FROM matter_jobs
        WHERE clerk_user_id = target_clerk_id
          AND status = 'done'
          AND result IS NOT NULL
          -- SEÑAL CORRUPTA no es una decodificación real → fuera de la galería.
          AND COALESCE(result -> 'dictamen_hud' ->> 'estado', '') <> 'SEÑAL CORRUPTA'
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 500))
    ) r;
    RETURN v_out;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_my_matter_records(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_my_matter_records(TEXT, INT) TO service_role;

-- Recargar el esquema de PostgREST.
NOTIFY pgrst, 'reload schema';

-- Verificar (con TU clerk_user_id real, copia uno de la tabla):
--   SELECT id, clerk_user_id, status, input_label, (result IS NOT NULL) AS has_result
--     FROM matter_jobs ORDER BY created_at DESC LIMIT 5;
--   -- toma un clerk_user_id de arriba y prueba que la lectura ya NO falla:
--   SELECT public.get_matter_job('<clerk_id>', '<record_uuid>');
--   SELECT public.get_my_matter_records('<clerk_id>', 50);
