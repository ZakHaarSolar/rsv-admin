-- Red Solar Viva · Ola C — REVOKE anon de las 2 herramientas de testing admin
-- de cristales (admin_regenerate_cristal / admin_reset_my_codices)
-- =====================================================================
-- Ambas estaban GRANT … TO anon, gateadas solo por un p_clerk_user_id
-- spoofeable → cualquiera con la anon key podía regenerar/resetear los
-- cristales y códices de un admin pasándose por él (baja severidad: solo
-- afecta los datos de testing del propio admin). Ahora se invocan SOLO por
-- el gateway verificado `admin-action` (service_role, tras verificar el
-- token de Clerk del admin, inyectando p_clerk_user_id con el id verificado).
--
-- NO toca is_admin_caller (helper de lectura que el frontend necesita para
-- mostrar/ocultar los botones admin) — queda abierto a anon a propósito.
--
-- ⚠️ Correr SOLO DESPUÉS de que la build iOS nueva (Cristales v1.8, que
-- llama por el gateway) esté VIVA en la App Store. La build publicada hoy
-- llama estas RPC directo; revocar antes rompería sus botones de testing
-- (solo admin) en iOS. Requiere además admin-action v1.3 desplegado.

DO $$
DECLARE
    r record;
    names text[] := ARRAY['admin_regenerate_cristal', 'admin_reset_my_codices'];
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
