-- Red Solar Viva · Decoder Scans Count RPC (v12.63)
-- ==========================================================
-- Objetivo: que el tripulante invitado pueda consultar SU propio conteo
-- de decoder_scans para que el badge X/3 persista correctamente entre
-- sesiones. La tabla decoder_scans tiene RLS solo para INSERT — la
-- lectura está cerrada (los datos completos solo se leen via RPC admin
-- con admin gate). Pero el tripulante necesita su count para el gate
-- freemium.
--
-- Solución: RPC pública SECURITY DEFINER que recibe target_clerk_id
-- y devuelve solo el COUNT (no datos sensibles). Patrón canónico del
-- proyecto, igual a ensure_profile.
--
-- Bug que resuelve: Diego (2026-04-25) reportó que al cerrar sesión y
-- volver a iniciar, freeShotsUsed se reseteaba a 0 (badge mostraba
-- 3/3 disponibles aunque ya había usado 1). Causa raíz: el fetch
-- directo a /rest/v1/decoder_scans devolvía [] porque RLS bloquea
-- SELECT — por eso rows.length === 0.

CREATE OR REPLACE FUNCTION get_my_decoder_scan_count(target_clerk_id TEXT)
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
    FROM decoder_scans
    WHERE clerk_user_id = target_clerk_id;

    RETURN COALESCE(total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_decoder_scan_count(TEXT) TO anon, authenticated;
