-- Red Solar Viva · Dream Records — título personalizado (rename en la Bóveda)
-- ==========================================================
-- Permite al Tripulante renombrar un sueño DESPUÉS de capturarlo. El título por
-- defecto sigue siendo banda_frecuencial (auto de decode-dream); custom_title lo
-- sobrescribe en la UI cuando está presente. Mismo patrón de seguridad que
-- delete_my_dream_record: keyed por target_clerk_id INYECTADO por el gateway
-- user-action (el cliente NO lo manda) → solo se toca la fila propia.

ALTER TABLE dream_records ADD COLUMN IF NOT EXISTS custom_title TEXT;

CREATE OR REPLACE FUNCTION rename_my_dream_record(
    target_clerk_id TEXT,
    p_record_id UUID,
    p_new_title TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_title TEXT;
    hit INT;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;
    IF p_record_id IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'record_required');
    END IF;
    clean_title := NULLIF(LEFT(BTRIM(COALESCE(p_new_title, '')), 80), '');
    UPDATE dream_records
       SET custom_title = clean_title
     WHERE id = p_record_id
       AND clerk_user_id = target_clerk_id;
    GET DIAGNOSTICS hit = ROW_COUNT;
    IF hit = 0 THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'custom_title', clean_title);
END;
$$;

GRANT EXECUTE ON FUNCTION rename_my_dream_record(TEXT, UUID, TEXT) TO anon, authenticated;

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
        SELECT id, created_at, dream_text, banda_frecuencial, banda_key,
               dictamen_vibral, calibracion_quirurgica, custom_title
        FROM dream_records
        WHERE clerk_user_id = target_clerk_id
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500))
    ) r;
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_dream_records(TEXT, INT) TO anon, authenticated;
