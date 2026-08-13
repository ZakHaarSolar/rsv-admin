-- Red Solar Viva · Barrido profundo 2026-06-13 — REVOKE de get_citas_1to1_de_tripulante (IDOR de PII)
-- =====================================================================
-- get_citas_1to1_de_tripulante(p_clerk_user_id TEXT, p_email TEXT) es SECURITY
-- DEFINER (bypassa el RLS de `reservas`) y filtra por (clerk_user_id = p) OR
-- (email = p) — AMBOS params FORJABLES, sin verificación de token. Confirmado
-- anon-alcanzable (http 200): con el id/email de una víctima volcaba su
-- zoom_join_url + zoom_password + email + intención de la sesión 1:1.
-- Ahora se invoca SÓLO por el gateway `user-action` v1.7 (inyecta el
-- clerk_user_id verificado del token; el p_email se ignora).
--
-- ⚠️ ORDEN: correr SOLO después de (a) desplegar `user-action` v1.7 y
-- (b) confirmar que Mi Núcleo → Sesiones (MN_Sesiones) carga las citas por el
-- gateway. WEB-ONLY (iOS no lo llama) → sin dependencia del build.

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
          AND p.proname = 'get_citas_1to1_de_tripulante'
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
