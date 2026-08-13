-- Red Solar Viva · Lote F — REVOKE anon de get_my_decoder_scan_count
-- =====================================================================
-- Cola IDOR de baja severidad: el contador freemium del Decodificador de
-- Materia (3 de por vida) estaba GRANT … TO anon y recibía un target_clerk_id
-- forjable en el body → cualquiera con la anon key podía leer el contador de
-- otro Tripulante. Baja severidad (sin PII / dinero / poder admin; el LÍMITE
-- ya se enforcea server-side en decode-matter/extract-text). Ahora se invoca
-- SOLO por el gateway verificado `user-action` (inyecta el clerk id del token).
--
-- ⚠️ Correr DESPUÉS de que la build iOS nueva (cliente EV_Decoder migrado al
-- gateway, v1.25) esté VIVA en la App Store. La web ya queda migrada antes
-- (auto-sync, EV_Decoder v1.34). Requiere user-action v1.8 desplegado
-- (whitelist get_my_decoder_scan_count → target_clerk_id).

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.proname,
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'get_my_decoder_scan_count'
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;',
            r.proname, r.args
        );
        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role;',
            r.proname, r.args
        );
        RAISE NOTICE 'locked: %(%)', r.proname, r.args;
    END LOOP;
END $$;
