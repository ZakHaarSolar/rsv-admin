-- Red Solar Viva · Dream Scans (Decodificador de Sueños)
-- ==========================================================
-- Espejo de decoder_scans para el freemium del Decodificador de Sueños:
-- 3 lecturas de por vida para no-miembros. El conteo es server-authoritative
-- (la edge decode-dream lee get_my_dream_scan_count ANTES de gastar Gemini y
-- llama record_dream_scan tras un dictamen exitoso → no se puede saltar
-- omitiendo el registro desde el cliente). Mismo patrón que decoder_scans.

-- Tabla principal
CREATE TABLE IF NOT EXISTS dream_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    /* metadata ligera para auditoría (sin guardar el texto del sueño) */
    banda_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_dream_scans_user_date
    ON dream_scans (clerk_user_id, created_at DESC);

ALTER TABLE dream_scans ENABLE ROW LEVEL SECURITY;

-- Insert solo del propio tripulante (con anon key); lectura cerrada por
-- defecto → solo admin/edge vía RPC SECURITY DEFINER.
DROP POLICY IF EXISTS insert_own_dream_scan ON dream_scans;
CREATE POLICY insert_own_dream_scan ON dream_scans
    FOR INSERT
    WITH CHECK (clerk_user_id IS NOT NULL);

-- Conteo de por vida (para el badge del cliente + el gate de la edge).
CREATE OR REPLACE FUNCTION get_my_dream_scan_count(target_clerk_id TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total INT;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*)::INT INTO total
    FROM dream_scans
    WHERE clerk_user_id = target_clerk_id;

    RETURN COALESCE(total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_dream_scan_count(TEXT) TO anon, authenticated;

-- Registro de un escaneo (lo llama la edge con service_role tras éxito).
CREATE OR REPLACE FUNCTION record_dream_scan(
    p_clerk_user_id TEXT,
    p_banda_key TEXT DEFAULT NULL
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

    INSERT INTO dream_scans (clerk_user_id, banda_key)
    VALUES (p_clerk_user_id, p_banda_key)
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_dream_scan(TEXT, TEXT) TO anon, authenticated, service_role;
