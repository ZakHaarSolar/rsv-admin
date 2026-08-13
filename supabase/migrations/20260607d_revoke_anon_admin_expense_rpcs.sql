-- Red Solar Viva · Ola C · Fase 3 (#2) — REVOKE anon de las RPC admin de gastos
-- =====================================================================
-- admin_upsert_expense / admin_delete_expense (Dashboard-only) quedaban
-- GRANT … TO anon, gateadas solo por un p_clerk_id spoofeable → cualquiera
-- con la anon key podía crear/editar/borrar los gastos operacionales del
-- panel financiero. Ahora se invocan SOLO por el gateway verificado
-- `admin-action` (service_role, tras verificar el token de Clerk del admin,
-- inyectando p_clerk_id con el id verificado).
--
-- ⚠️ Correr SOLO después de confirmar que el panel de Gastos Operacionales
-- (Telemetría del Núcleo) puede crear/editar un gasto por el gateway.

DO $$
DECLARE
    r record;
    names text[] := ARRAY['admin_upsert_expense', 'admin_delete_expense'];
BEGIN
    FOR r IN
        SELECT p.proname,
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(names)
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
