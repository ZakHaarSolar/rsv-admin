-- Red Solar Viva · Auditoría pre-build · Iteración A — REVOKE de writes anon de griefing
-- =====================================================================================
-- HALLAZGO (LIVE-CONFIRMED, sev ALTA · A01 Broken Access Control):
--   record_dream_scan(text,text) y record_decoder_scan(...) tenían GRANT … TO anon.
--   Con la anon key pública, cualquiera INSERTA filas de contador para un
--   clerk_user_id arbitrario → (a) infla el contador freemium de una víctima
--   para agotarle sus 3 lecturas gratis, y (b) escribe sin límite en la DB.
--   Probado en vivo: inserté una fila para un id forjado y el contador subió 0→1.
--
-- POR QUÉ ES SEGURO CERRAR YA (sin tocar la app viva):
--   El ÚNICO llamador legítimo de ambas son las edge functions que corren con
--   service_role tras un dictamen exitoso, usando el clerk_user_id VERIFICADO del
--   token de Clerk:
--     - admin/supabase/functions/decode-matter/index.ts:694  → record_decoder_scan
--     - admin/supabase/functions/decode-dream/index.ts:426    → record_dream_scan
--   Ningún cliente (Code/ ni escaner-app/) las llama (el registro client-side se
--   quitó en Ola A). service_role ya tiene EXECUTE; revocar anon NO degrada nada.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure::text AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('record_dream_scan', 'record_decoder_scan')
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', r.sig);
        EXECUTE format('GRANT  EXECUTE ON FUNCTION %s TO service_role;', r.sig);
        RAISE NOTICE 'Locked %', r.sig;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- Verificación post-run (debe devolver 0 filas = ya no ejecutables por anon):
--   SELECT p.proname
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND p.proname IN ('record_dream_scan','record_decoder_scan')
--     AND has_function_privilege('anon', p.oid, 'EXECUTE');
