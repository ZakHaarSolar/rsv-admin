-- Red Solar Viva · Auditoría pre-build · Iteración B — REVOKE del IDOR de la Bóveda de Sueños
-- =====================================================================================
-- HALLAZGO (LIVE-CONFIRMED · CRÍTICO · A01 Broken Access Control):
--   get_my_dream_records(target_clerk_id,p_limit) — SECURITY DEFINER GRANT anon con
--   target_clerk_id forjable. Probado en vivo: con la anon key + un id cosechado de
--   scan_vibracional, leí el TEXTO ÍNTEGRO de los sueños privados + dictamen de IA de
--   Tripulantes reales. Es la PII más sensible del producto.
--   get_my_dream_scan_count(target_clerk_id) — mismo patrón (IDOR del contador freemium).
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ⚠️ ORDEN OBLIGATORIO — NO pegar este SQL hasta haber hecho lo siguiente:      │
-- │   1. Desplegado la edge:  supabase functions deploy user-action --no-verify-jwt │
-- │      (user-action v1.5 ya tiene get_my_dream_records + get_my_dream_scan_count │
-- │       en el whitelist, inyectando el clerk_user_id verificado del token).      │
-- │   2. Confirmado que la web Framer sincronizó EV_DreamDecoder v1.5 (la Bóveda   │
-- │      web ahora llama por el gateway, no REST directo).                          │
-- │   El build iOS vivo (7-jun) NO tiene la Bóveda → no se rompe nada en iOS.       │
-- │   El próximo build iOS ya sale migrado (escaner-app EV_DreamDecoder v1.4).      │
-- │   Si pegás esto ANTES del paso 1+2, la Bóveda web devuelve 401 hasta sincronizar.│
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- service_role conserva EXECUTE: la edge decode-dream sigue leyendo el contador
-- server-side (gate freemium) y escribiendo los registros sin problema.
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
          AND p.proname IN ('get_my_dream_records', 'get_my_dream_scan_count')
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
--     AND p.proname IN ('get_my_dream_records','get_my_dream_scan_count')
--     AND has_function_privilege('anon', p.oid, 'EXECUTE');
