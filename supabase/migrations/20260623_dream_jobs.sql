-- Red Solar Viva · Dream Jobs — Decodificación ASÍNCRONA (a prueba de sobrecarga)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Fase 2 del Decodificador de Sueños "a prueba de balas". La cascada de Gemini
-- (decode-dream v1.7) puede tardar ~70s cuando Gemini está saturado (503). En
-- modo síncrono el Tripulante tiene que quedarse mirando la pantalla. Con jobs
-- asíncronos: la edge crea un registro 'processing' al instante, devuelve su id,
-- y corre la cascada en segundo plano (EdgeRuntime.waitUntil). El cliente poolea
-- get_dream_job; si el Tripulante SALE de la app, el dictamen igual aterriza en
-- su Bóveda de Sueños (y un push lo avisa, cuando el push esté LIVE).
--
-- dream_records gana un ciclo de estado: 'processing' → 'done' | 'failed'.
--   • Las filas VIEJAS (ya tenían dictamen) → 'done' por el DEFAULT.
--   • create_dream_job / complete_dream_job → SOLO service_role (la edge).
--   • get_dream_job → vía gateway user-action (id inyectado del token).

-- ── 1) Ciclo de estado en dream_records ──────────────────────────────
ALTER TABLE dream_records
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'done';

-- Índice parcial para el reaper de jobs huérfanos (solo toca 'processing').
CREATE INDEX IF NOT EXISTS idx_dream_records_processing
    ON dream_records (status, created_at)
    WHERE status = 'processing';

-- ── 2) create_dream_job — la edge inserta el job 'processing' (service_role).
--     Devuelve el id para que el cliente lo poolee. El dream_text se guarda ya
--     (así sobrevive aunque el Tripulante cierre la app antes del dictamen).
CREATE OR REPLACE FUNCTION create_dream_job(
    p_clerk_user_id TEXT,
    p_dream_text TEXT
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
    INSERT INTO dream_records (clerk_user_id, dream_text, status)
    VALUES (p_clerk_user_id, LEFT(p_dream_text, 4000), 'processing')
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION create_dream_job(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION create_dream_job(TEXT, TEXT) TO service_role;

-- ── 3) complete_dream_job — la edge cierra el job al terminar la cascada
--     (service_role). status 'done' (dictamen listo) o 'failed' (sobrecarga).
CREATE OR REPLACE FUNCTION complete_dream_job(
    p_id UUID,
    p_banda_frecuencial TEXT,
    p_banda_key TEXT,
    p_dictamen_vibral TEXT,
    p_calibracion_quirurgica TEXT,
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
    UPDATE dream_records
       SET banda_frecuencial      = p_banda_frecuencial,
           banda_key              = p_banda_key,
           dictamen_vibral        = p_dictamen_vibral,
           calibracion_quirurgica = p_calibracion_quirurgica,
           status                 = COALESCE(NULLIF(p_status, ''), 'done')
     WHERE id = p_id;
    GET DIAGNOSTICS hit = ROW_COUNT;
    RETURN json_build_object('ok', hit > 0);
END;
$$;
REVOKE EXECUTE ON FUNCTION complete_dream_job(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION complete_dream_job(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
    TO service_role;

-- ── 4) get_dream_job — el cliente poolea UN job por id (vía gateway
--     user-action: target_clerk_id lo inyecta el gateway desde el token, el
--     cliente NO lo manda → solo lee su propia fila). Mismo patrón que
--     get_my_dream_records / get_my_dream_scan_count.
CREATE OR REPLACE FUNCTION get_dream_job(
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
        SELECT id, created_at, status, banda_frecuencial, banda_key,
               dictamen_vibral, calibracion_quirurgica, custom_title
        FROM dream_records
        WHERE id = p_record_id AND clerk_user_id = target_clerk_id
        LIMIT 1
    ) r;
    RETURN result;
END;
$$;
-- Gateway-only: el cliente la llama por user-action (inyecta target_clerk_id del
-- token). Conceder a anon sería un IDOR (POST directo con un record_id ajeno).
REVOKE EXECUTE ON FUNCTION get_dream_job(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_dream_job(TEXT, UUID) TO service_role;

-- ── 5) get_my_dream_records — re-creada para incluir `status` (la Bóveda pinta
--     'processing'/'failed' distinto a 'done'). Mismo cuerpo que la migración
--     20260616, + status en el SELECT.
CREATE OR REPLACE FUNCTION get_my_dream_records(
    target_clerk_id TEXT,
    p_limit INT DEFAULT 100
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
        SELECT id, created_at, status, dream_text, banda_frecuencial, banda_key,
               dictamen_vibral, calibracion_quirurgica, custom_title
        FROM dream_records
        WHERE clerk_user_id = target_clerk_id
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500))
    ) r;
    RETURN result;
END;
$$;
-- 🜂 CRÍTICO — re-afirmar el REVOKE: este CREATE OR REPLACE re-otorgaría a anon
-- el permiso que 20260620n cerró (era "exactamente la fuga de sueños privados":
-- SECURITY DEFINER que confía en target_clerk_id del body → IDOR de PII). El
-- cliente la llama por el gateway user-action (inyecta el id del token). NUNCA
-- re-correr el GRANT ... TO anon original.
REVOKE EXECUTE ON FUNCTION get_my_dream_records(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_my_dream_records(TEXT, INT) TO service_role;

-- ── 6) Reaper de jobs huérfanos (OPCIONAL pero recomendado) ───────────
-- Si la edge muere a mitad de la cascada (proceso matado, deploy en medio),
-- un job queda 'processing' para siempre. Esta función lo marca 'failed' tras
-- N minutos para que el cliente (y la Bóveda) muestren el estado de reintento.
-- La edge YA marca 'failed' cuando la cascada agota su presupuesto (~70s); esto
-- solo cubre el caso del proceso interrumpido.
CREATE OR REPLACE FUNCTION requeue_stale_dream_jobs(p_minutes INT DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    n INT;
BEGIN
    UPDATE dream_records
       SET status = 'failed'
     WHERE status = 'processing'
       AND created_at < now() - make_interval(mins => GREATEST(1, p_minutes));
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION requeue_stale_dream_jobs(INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION requeue_stale_dream_jobs(INT) TO service_role;

-- pg_cron: barre jobs huérfanos cada 5 min (pg_cron ya está activo por el cron
-- del Radar / reservas). Si CREATE EXTENSION da error de permisos, activá
-- pg_cron desde Dashboard → Database → Extensions y volvé a correr.
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
    PERFORM cron.unschedule('dream-jobs-reaper');
EXCEPTION WHEN OTHERS THEN
    NULL;
END$$;
SELECT cron.schedule(
    'dream-jobs-reaper',
    '*/5 * * * *',
    $$ SELECT public.requeue_stale_dream_jobs(5); $$
);

-- Recargar el esquema de PostgREST tras los cambios de permisos.
NOTIFY pgrst, 'reload schema';

-- Verificar (opcional):
--   SELECT public.requeue_stale_dream_jobs(5);
--   SELECT id, status, created_at FROM dream_records ORDER BY created_at DESC LIMIT 5;
