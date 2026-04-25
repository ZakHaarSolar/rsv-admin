-- Red Solar Viva · Decoder Scans (Decodificador de Materia)
-- ==========================================================
-- Objetivo: persistir cada dictamen del Decodificador de Materia para
-- que el Motor de Intervención pueda mostrar al admin una tabla
-- día-por-día de cuántos dictámenes ha hecho cada tripulante.
-- Edge function decode-matter NO escribe en DB (solo devuelve el
-- dictamen); la escritura vive en el frontend de EscanerVibracional
-- después de recibir el resultado exitoso.

-- Tabla principal
CREATE TABLE IF NOT EXISTS decoder_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    /* Ejes del dictamen_hud (0-100). NULLable por si el edge fn falla
       entre dictamen y persist — preferimos row parcial a row perdida. */
    friccion_biologica INT,
    friccion_energetica INT,
    impacto_matriz INT,
    categoria_detectada TEXT,
    /* Metadata útil para auditoría y debug sin guardar la imagen. */
    comando_final TEXT,
    ingredientes_chars INT,
    ocr_confidence NUMERIC(4, 3)
);

CREATE INDEX IF NOT EXISTS idx_decoder_scans_user_date
    ON decoder_scans (clerk_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decoder_scans_day
    ON decoder_scans (DATE(created_at AT TIME ZONE 'America/Mexico_City'));

ALTER TABLE decoder_scans ENABLE ROW LEVEL SECURITY;

-- Policy: el tripulante inserta solo sus propios escaneos con su anon key.
-- Lectura queda cerrada por defecto → solo admin vía RPC.
DROP POLICY IF EXISTS insert_own_decoder_scan ON decoder_scans;
CREATE POLICY insert_own_decoder_scan ON decoder_scans
    FOR INSERT
    WITH CHECK (clerk_user_id IS NOT NULL);

-- RPC admin: escaneos por día de un tripulante
-- Patrón: admin_clerk_id explícito (igual que admin_create_exploration_pass
-- y get_1to1_revenue_summary), verificación contra profiles.is_admin.
CREATE OR REPLACE FUNCTION get_decoder_scans_by_day(
    target_clerk_id TEXT,
    admin_clerk_id TEXT
)
RETURNS TABLE (
    day DATE,
    scan_count BIGINT,
    avg_impacto NUMERIC,
    max_impacto INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        DATE(ds.created_at AT TIME ZONE 'America/Mexico_City') AS day,
        COUNT(*)::BIGINT AS scan_count,
        ROUND(AVG(ds.impacto_matriz)::NUMERIC, 1) AS avg_impacto,
        MAX(ds.impacto_matriz) AS max_impacto
    FROM decoder_scans ds
    WHERE ds.clerk_user_id = target_clerk_id
    GROUP BY day
    ORDER BY day DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_decoder_scans_by_day(TEXT, TEXT) TO anon, authenticated;

-- RPC admin: total acumulado (stat rápido para badge)
CREATE OR REPLACE FUNCTION get_decoder_scans_total(
    target_clerk_id TEXT,
    admin_clerk_id TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total INT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT COUNT(*)::INT INTO total
    FROM decoder_scans
    WHERE clerk_user_id = target_clerk_id;

    RETURN COALESCE(total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_decoder_scans_total(TEXT, TEXT) TO anon, authenticated;
