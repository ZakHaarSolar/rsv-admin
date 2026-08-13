-- Red Solar Viva · Matter Jobs — Decodificador de Materia ASÍNCRONO (a prueba de salir de la app)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Espejo de 20260623_dream_jobs.sql, pero el Decodificador de Materia NO tiene
-- Bóveda (galería histórica) → `matter_jobs` es un HANDLE EFÍMERO del resultado:
-- la edge crea el job 'processing' al instante, devuelve su id, corre la cascada
-- de Gemini en segundo plano (EdgeRuntime.waitUntil) y al terminar guarda el
-- dictamen completo en `result jsonb`. El cliente poolea get_matter_job; si el
-- Tripulante SALE de la app, el job sobrevive in-flight y al volver (resume por
-- localStorage o por el push) se REVELA. La OCR (extract-text) sigue síncrona;
-- solo la cascada de Gemini va al background.
--
--   • create_matter_job / complete_matter_job → SOLO service_role (la edge).
--   • get_matter_job → vía gateway user-action (id inyectado del token).
--   • reaper pg_cron → marca 'failed' los jobs huérfanos + purga los viejos
--     (la tabla no archiva nada, a diferencia de dream_records).

-- ── 1) Tabla efímera de jobs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matter_jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'processing',   -- processing | done | failed
    result        jsonb,                                -- el dictamen completo al terminar
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gateway-only: sin policies + RLS habilitado → ni anon ni authenticated tocan
-- la tabla con la anon key. Las RPC SECURITY DEFINER (owner) bypassan RLS.
ALTER TABLE matter_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON matter_jobs FROM anon, authenticated;

-- Índice para que el cliente lea su job por id rápido + reaper de huérfanos.
CREATE INDEX IF NOT EXISTS idx_matter_jobs_owner
    ON matter_jobs (clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matter_jobs_processing
    ON matter_jobs (status, created_at)
    WHERE status = 'processing';

-- ── 2) create_matter_job — la edge inserta el job 'processing' (service_role)
--     y devuelve su id para que el cliente lo poolee. NO guarda el input: el
--     decode corre íntegro en la closure de la edge (waitUntil); el job es solo
--     el handle del resultado.
CREATE OR REPLACE FUNCTION create_matter_job(
    p_clerk_user_id TEXT
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
    INSERT INTO matter_jobs (clerk_user_id, status)
    VALUES (p_clerk_user_id, 'processing')
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION create_matter_job(TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION create_matter_job(TEXT) TO service_role;

-- ── 3) complete_matter_job — la edge cierra el job al terminar la cascada
--     (service_role). status 'done' (dictamen en result) o 'failed' (sobrecarga).
CREATE OR REPLACE FUNCTION complete_matter_job(
    p_id UUID,
    p_result jsonb,
    p_status TEXT DEFAULT 'done'
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
           status = COALESCE(NULLIF(p_status, ''), 'done')
     WHERE id = p_id;
    GET DIAGNOSTICS hit = ROW_COUNT;
    RETURN json_build_object('ok', hit > 0);
END;
$$;
REVOKE EXECUTE ON FUNCTION complete_matter_job(UUID, jsonb, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION complete_matter_job(UUID, jsonb, TEXT)
    TO service_role;

-- ── 4) get_matter_job — el cliente poolea UN job por id (vía gateway
--     user-action: target_clerk_id lo inyecta el gateway desde el token, el
--     cliente NO lo manda → solo lee su propia fila). Mismo patrón que
--     get_dream_job. Conceder a anon sería un IDOR (POST directo con un id ajeno).
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
        SELECT id, created_at, status, result
        FROM matter_jobs
        WHERE id = p_record_id AND clerk_user_id = target_clerk_id
        LIMIT 1
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) TO service_role;

-- ── 5) Reaper de jobs huérfanos + purga de la tabla efímera ────────────
-- Si la edge muere a mitad de la cascada, un job queda 'processing' para
-- siempre → lo marcamos 'failed' tras N minutos. Y como matter_jobs NO archiva
-- nada (≠ dream_records), purgamos done/failed viejos (>1 día) para mantenerla
-- liviana. La edge YA marca 'failed' cuando la cascada agota (~70s); esto cubre
-- el proceso interrumpido + el aseo.
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
    -- Aseo: la tabla es un handle efímero, no una galería → borra lo viejo.
    DELETE FROM matter_jobs
     WHERE status IN ('done', 'failed')
       AND created_at < now() - interval '1 day';
    RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION requeue_stale_matter_jobs(INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION requeue_stale_matter_jobs(INT) TO service_role;

-- pg_cron: barre cada 5 min (pg_cron ya está activo por el cron del Radar /
-- reservas / dream-jobs). Si CREATE EXTENSION da error de permisos, activá
-- pg_cron desde Dashboard → Database → Extensions y volvé a correr.
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
    PERFORM cron.unschedule('matter-jobs-reaper');
EXCEPTION WHEN OTHERS THEN
    NULL;
END$$;
SELECT cron.schedule(
    'matter-jobs-reaper',
    '*/5 * * * *',
    $$ SELECT public.requeue_stale_matter_jobs(5); $$
);

-- Recargar el esquema de PostgREST tras los cambios de permisos.
NOTIFY pgrst, 'reload schema';

-- Verificar (opcional):
--   SELECT public.requeue_stale_matter_jobs(5);
--   SELECT id, status, created_at FROM matter_jobs ORDER BY created_at DESC LIMIT 5;
