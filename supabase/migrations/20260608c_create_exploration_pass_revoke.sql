-- Red Solar Viva · Ola C — REVOKE anon de admin_create_exploration_pass
-- =====================================================================
-- admin_create_exploration_pass (registrar un Pase de Exploración manual
-- desde Telemetría del Núcleo) quedaba GRANT … TO anon, gateada solo por
-- un p_clerk_user_id spoofeable → cualquiera con la anon key podía insertar
-- filas en exploration_passes (bypass de RLS vía la función SECURITY
-- DEFINER) pasándose por admin. Ahora se invoca SOLO por el gateway
-- verificado `admin-action` (service_role, tras verificar el token de
-- Clerk del admin, inyectando p_clerk_user_id con el id verificado).
--
-- Tiene DOS overloads (5-arg sin group_name y 6-arg con p_group_name).
-- El FOR sobre pg_proc las cubre AMBAS automáticamente.
--
-- ⚠️ Correr SOLO después de:
--   1. Desplegar admin-action v1.2 (ya trae la entrada en ADMIN_RPCS).
--   2. Confirmar que el form "Agregar Pase de Exploración" de Telemetría
--      del Núcleo puede crear un pase por el gateway.

DO $$
DECLARE
    r record;
    names text[] := ARRAY['admin_create_exploration_pass'];
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
