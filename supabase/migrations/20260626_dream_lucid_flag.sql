-- 20260626_dream_lucid_flag.sql
-- Marca "sueño lúcido" para el Decodificador de Sueños: el Tripulante marca al
-- escribir si fue un sueño lúcido; la Bóveda filtra por esa marca.
-- Pegar en Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- (Después: redeploy de decode-dream + el próximo build iOS.)

-- 1) Columna nueva en dream_records (default false; no rompe filas viejas).
ALTER TABLE dream_records
    ADD COLUMN IF NOT EXISTS is_lucid boolean NOT NULL DEFAULT false;

-- 2) create_dream_job — suma p_is_lucid. Cambia la firma (2 -> 3 args), así que
--    DROP del overload viejo + CREATE del nuevo (con default false). Solo la
--    edge (service_role) la llama; nadie más depende de la firma vieja.
DROP FUNCTION IF EXISTS create_dream_job(TEXT, TEXT);
CREATE OR REPLACE FUNCTION create_dream_job(
    p_clerk_user_id TEXT,
    p_dream_text TEXT,
    p_is_lucid BOOLEAN DEFAULT false
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
    INSERT INTO dream_records (clerk_user_id, dream_text, status, is_lucid)
    VALUES (p_clerk_user_id, LEFT(p_dream_text, 4000), 'processing',
            COALESCE(p_is_lucid, false))
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION create_dream_job(TEXT, TEXT, BOOLEAN)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION create_dream_job(TEXT, TEXT, BOOLEAN) TO service_role;

-- 3) get_my_dream_records — mismo cuerpo vigente (20260623) + is_lucid en el
--    SELECT para que la Bóveda pueda filtrar. Misma firma (TEXT, INT) -> OR REPLACE.
--    🜂 Re-afirmar el REVOKE (este CREATE OR REPLACE re-otorgaría a anon lo que
--    20260620n cerró — era la fuga de sueños privados). Solo gateway/service_role.
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
               dictamen_vibral, calibracion_quirurgica, custom_title, is_lucid
        FROM dream_records
        WHERE clerk_user_id = target_clerk_id
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500))
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_my_dream_records(TEXT, INT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_my_dream_records(TEXT, INT) TO service_role;
