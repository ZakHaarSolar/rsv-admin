-- Red Solar Viva · Decoder Scans Record RPC (v12.64)
-- ==========================================================
-- Objetivo: persistir cada decodificación exitosa via RPC en lugar de
-- INSERT directo a /rest/v1/decoder_scans. Esto bypassa cualquier issue
-- de RLS y unifica con get_my_decoder_scan_count para tener
-- lectura+escritura por RPC.
--
-- Bug que resuelve: Diego (2026-04-25) reportó que aunque ya aplicó
-- el get_my_decoder_scan_count RPC y redeploy del Decoder, los
-- escaneos no se persisten al re-login. Causa más probable: el INSERT
-- directo está fallando silenciosamente porque la RLS exige que la
-- request venga de un contexto authenticated o que clerk_user_id
-- coincida con auth.uid() (que con Clerk no aplica). El POST con
-- "Prefer: return=minimal" no devuelve error visible aunque el insert
-- se rechace.
--
-- Solución: RPC SECURITY DEFINER que escribe la fila como postgres,
-- bypassando RLS. Recibe los campos del dictamen y devuelve el UUID
-- del row creado. Patrón canónico (igual a admin_create_exploration_pass
-- y get_my_decoder_scan_count).

CREATE OR REPLACE FUNCTION record_decoder_scan(
    p_clerk_user_id TEXT,
    p_friccion_biologica INT DEFAULT NULL,
    p_friccion_energetica INT DEFAULT NULL,
    p_impacto_matriz INT DEFAULT NULL,
    p_categoria_detectada TEXT DEFAULT NULL,
    p_comando_final TEXT DEFAULT NULL
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

    INSERT INTO decoder_scans (
        clerk_user_id,
        friccion_biologica,
        friccion_energetica,
        impacto_matriz,
        categoria_detectada,
        comando_final
    ) VALUES (
        p_clerk_user_id,
        p_friccion_biologica,
        p_friccion_energetica,
        p_impacto_matriz,
        p_categoria_detectada,
        p_comando_final
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_decoder_scan(TEXT, INT, INT, INT, TEXT, TEXT) TO anon, authenticated;
