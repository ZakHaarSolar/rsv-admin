-- Red Solar Viva · Dream Records (Bóveda de Estasis)
-- ==========================================================
-- Guarda el sueño completo + su dictamen para construir la galería de
-- registros ("Bóveda de Estasis") del Decodificador de Sueños. A diferencia
-- de dream_scans (contador freemium, solo no-miembros), aquí se registra a
-- TODOS los Tripulantes — la edge decode-dream inserta server-side tras un
-- dictamen exitoso, con el clerk_user_id VERIFICADO del token de Clerk.

CREATE TABLE IF NOT EXISTS dream_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dream_text TEXT NOT NULL,
    banda_frecuencial TEXT,
    banda_key TEXT,
    dictamen_vibral TEXT,
    calibracion_quirurgica TEXT
);

CREATE INDEX IF NOT EXISTS idx_dream_records_user_date
    ON dream_records (clerk_user_id, created_at DESC);

ALTER TABLE dream_records ENABLE ROW LEVEL SECURITY;
-- Sin policies → tabla cerrada a anon. Lectura solo vía RPC SECURITY DEFINER
-- (get_my_dream_records); escritura solo desde la edge con service_role.

-- Inserta un registro (lo llama la edge con service_role tras un dictamen).
CREATE OR REPLACE FUNCTION record_dream_record(
    p_clerk_user_id TEXT,
    p_dream_text TEXT,
    p_banda_frecuencial TEXT DEFAULT NULL,
    p_banda_key TEXT DEFAULT NULL,
    p_dictamen_vibral TEXT DEFAULT NULL,
    p_calibracion_quirurgica TEXT DEFAULT NULL
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

    INSERT INTO dream_records (
        clerk_user_id, dream_text, banda_frecuencial, banda_key,
        dictamen_vibral, calibracion_quirurgica
    )
    VALUES (
        p_clerk_user_id, LEFT(p_dream_text, 4000), p_banda_frecuencial,
        p_banda_key, p_dictamen_vibral, p_calibracion_quirurgica
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_dream_record(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
    TO service_role;

-- Devuelve los registros del Tripulante (galería), más nuevos primero.
-- SECURITY DEFINER, keyed por clerk_user_id (mismo patrón que
-- get_my_dream_scan_count). El cliente manda su propio id.
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

    SELECT COALESCE(
        json_agg(row_to_json(r) ORDER BY r.created_at DESC),
        '[]'::json
    )
    INTO result
    FROM (
        SELECT id, created_at, dream_text, banda_frecuencial, banda_key,
               dictamen_vibral, calibracion_quirurgica
        FROM dream_records
        WHERE clerk_user_id = target_clerk_id
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500))
    ) r;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_dream_records(TEXT, INT) TO anon, authenticated;
