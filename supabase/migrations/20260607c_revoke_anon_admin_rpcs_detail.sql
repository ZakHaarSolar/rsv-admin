-- Red Solar Viva · Ola C · Fase 3 (#2) — REVOKE anon de las 7 RPC admin de MI_Detail
-- =====================================================================
-- Estas 7 RPC quedaban GRANT … TO anon, authenticated y gateadas solo por un
-- p_admin_clerk_id spoofeable → cualquiera con la anon key podía auto-regalarse
-- Sintonía/cristales o leer datos de otros. Ahora se invocan SOLO por el gateway
-- verificado `admin-action` (service_role, tras verificar el token de Clerk del
-- admin), así que se cierran a todos los roles públicos.
--
-- IMPORTANTE: se revoca también de PUBLIC (el GRANT por defecto al crear la
-- función), no solo de anon/authenticated — si no, anon sigue ejecutando vía
-- PUBLIC. Se mantiene/garantiza service_role para que el gateway funcione.
--
-- ⚠️ Correr SOLO después de confirmar que el panel admin (Motor de
-- Intervención) carga los datos de un tripulante por el gateway. Si algo
-- fallara, el gateway quedaría sin poder ejecutar las RPC.
--
-- NO incluye admin_regenerate_cristal / admin_reset_my_codices (los usa la app
-- iOS viva → su REVOKE espera la build) ni las expense / create_exploration_pass
-- (aún no migradas al gateway).

DO $$
DECLARE
    r record;
    names text[] := ARRAY[
        'admin_activate_sintonia',
        'admin_revoke_sintonia',
        'admin_grant_cristal',
        'admin_revoke_cristal',
        'admin_get_user_cristales',
        'admin_get_user_navegante_progress',
        'admin_get_user_codices_full'
    ];
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
