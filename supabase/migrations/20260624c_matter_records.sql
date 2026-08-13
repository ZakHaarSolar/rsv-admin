-- Red Solar Viva · Bóveda de Materia — galería permanente de decodificaciones de alimentos
-- =====================================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Promueve `matter_jobs` (antes EFÍMERA, se purgaba >1 día) a la galería
-- PERMANENTE del Decodificador de Materia — el espejo de dream_records para
-- Sueños. Esto le da a Materia el mismo "piso" robusto que Sueños: el dictamen
-- 'done' vive para siempre y SIEMPRE tiene dónde aterrizar (la Bóveda), aunque
-- la revelación en vivo falle por timing.
--
-- Novedad clave: `input_label` = el NOMBRE del material escaneado (lo que el
-- Tripulante escribió, o el ingrediente principal en escaneos por foto). Es el
-- TÍTULO de cada tarjeta de la Bóveda Y el campo sobre el que corre el BUSCADOR
-- (ej. buscar "harina" encuentra "Harina de Konjac"). El buscador NO mira el
-- dictamen, solo el nombre del material.
--
--   • create_matter_job / complete_matter_job → service_role (la edge), ahora
--     con input_label.
--   • get_my_matter_records / delete_my_matter_record → gateway user-action
--     (id inyectado del token).
--   • El reaper deja de borrar los 'done' (son la galería); solo marca 'processing'
--     huérfano → 'failed' y limpia los 'failed' viejos (>7 días, no se muestran).

-- ── 1) Columna del nombre del material (título + buscador) ────────────
ALTER TABLE matter_jobs
    ADD COLUMN IF NOT EXISTS input_label TEXT;

-- ── 2) create_matter_job — ahora acepta el nombre del material (input_label).
--     Para escaneos por texto (matter_name) el cliente/edge lo conoce de una;
--     para foto llega null y se rellena al completar (desde el dictamen).
DROP FUNCTION IF EXISTS create_matter_job(TEXT);
CREATE OR REPLACE FUNCTION create_matter_job(
    p_clerk_user_id TEXT,
    p_input_label TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id UUID;
BEGIN
    IF p_clerk_user_id IS NULL OR LENGTH(p_clerk_user_id) < 3 THEN
        RAISE EXCEPTION 'clerk_user_id required';
    END IF;
    INSERT INTO matter_jobs (clerk_user_id, status, input_label)
    VALUES (
        p_clerk_user_id,
        'processing',
        NULLIF(BTRIM(COALESCE(p_input_label, '')), '')
    )
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION create_matter_job(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION create_matter_job(TEXT, TEXT) TO service_role;

-- ── 3) complete_matter_job — guarda el dictamen + status, y rellena input_label
--     SOLO si aún está vacío (los escaneos por foto lo reciben acá, derivado del
--     dictamen; los de texto ya lo traían de create y se conservan).
DROP FUNCTION IF EXISTS complete_matter_job(UUID, jsonb, TEXT);
CREATE OR REPLACE FUNCTION complete_matter_job(
    p_id UUID,
    p_result jsonb,
    p_status TEXT DEFAULT 'done',
    p_input_label TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hit INT;
BEGIN
    UPDATE matter_jobs
       SET result = p_result,
           status = COALESCE(NULLIF(p_status, ''), 'done'),
           input_label = COALESCE(
               NULLIF(BTRIM(COALESCE(input_label, '')), ''),
               NULLIF(BTRIM(COALESCE(p_input_label, '')), '')
           )
     WHERE id = p_id;
    GET DIAGNOSTICS hit = ROW_COUNT;
    RETURN json_build_object('ok', hit > 0);
END;
$$;
REVOKE EXECUTE ON FUNCTION complete_matter_job(UUID, jsonb, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION complete_matter_job(UUID, jsonb, TEXT, TEXT)
    TO service_role;

-- ── 4) get_matter_job — el cliente poolea UN job por id; ahora también devuelve
--     input_label (para titular la revelación). Mismo gate-only de siempre.
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
    result json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3
       OR p_record_id IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT row_to_json(r) INTO result
    FROM (
        SELECT id, created_at, status, result, input_label
        FROM matter_jobs
        WHERE id = p_record_id AND clerk_user_id = target_clerk_id
        LIMIT 1
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) TO service_role;

-- ── 5) get_my_matter_records — la GALERÍA (solo 'done'). Devuelve nombre +
--     fecha + dictamen completo. El buscador corre en el cliente sobre
--     input_label (nombre del material). Gateway-only (id inyectado del token).
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
    result json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN '[]'::json;
    END IF;
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT id, created_at, input_label, result
        FROM matter_jobs
        WHERE clerk_user_id = target_clerk_id
          AND status = 'done'
          AND result IS NOT NULL
          -- SEÑAL CORRUPTA ("recaptura con más nitidez") NO es una decodificación
          -- real: el job queda 'done' (para que la lectura en vivo muestre el
          -- mensaje de recaptura) pero NO ensucia la galería con tarjetas basura.
          AND COALESCE(result -> 'dictamen_hud' ->> 'estado', '') <> 'SEÑAL CORRUPTA'
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 500))
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_my_matter_records(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_my_matter_records(TEXT, INT) TO service_role;

-- ── 6) delete_my_matter_record — borra una decodificación de la Bóveda. Keyed
--     por el id verificado (lo inyecta el gateway) → solo borra la fila propia.
CREATE OR REPLACE FUNCTION delete_my_matter_record(
    target_clerk_id TEXT,
    p_record_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INT;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 OR p_record_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'bad_args');
    END IF;
    DELETE FROM matter_jobs
     WHERE id = p_record_id
       AND clerk_user_id = target_clerk_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN jsonb_build_object('ok', v_deleted > 0, 'deleted', v_deleted);
END;
$$;
REVOKE EXECUTE ON FUNCTION delete_my_matter_record(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION delete_my_matter_record(TEXT, UUID) TO service_role;

-- ── 7) Reaper — ya NO borra los 'done' (son la galería permanente). Solo marca
--     'processing' huérfano → 'failed' y limpia los 'failed' viejos (>7 días,
--     no se muestran en la Bóveda) para no acumular jobs muertos.
CREATE OR REPLACE FUNCTION requeue_stale_matter_jobs(p_minutes INT DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    n INT;
BEGIN
    UPDATE matter_jobs
       SET status = 'failed'
     WHERE status = 'processing'
       AND created_at < now() - make_interval(mins => GREATEST(1, p_minutes));
    GET DIAGNOSTICS n = ROW_COUNT;
    -- Limpieza de jobs muertos (no se muestran). Los 'done' se conservan SIEMPRE.
    DELETE FROM matter_jobs
     WHERE status = 'failed'
       AND created_at < now() - interval '7 days';
    RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION requeue_stale_matter_jobs(INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION requeue_stale_matter_jobs(INT) TO service_role;

-- (el cron 'matter-jobs-reaper' de 20260624b sigue llamando a requeue_stale_matter_jobs)

-- Recargar el esquema de PostgREST tras los cambios de firma/permisos.
NOTIFY pgrst, 'reload schema';

-- Verificar (opcional):
--   SELECT public.get_my_matter_records('<clerk_id>', 50);
--   SELECT id, status, input_label, created_at FROM matter_jobs ORDER BY created_at DESC LIMIT 5;
