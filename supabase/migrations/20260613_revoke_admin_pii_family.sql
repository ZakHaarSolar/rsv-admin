-- Red Solar Viva · Barrido profundo 2026-06-13 — REVOKE de la familia admin "padrón/correo"
-- =====================================================================
-- CADENA ANON→PII CONFIRMADA VIVA: un anónimo con sólo la anon key podía
--   1) cosechar clerk_ids reales de scan_vibracional (anon-readable),
--   2) descubrir el id del admin pasándolos por is_admin_caller,
--   3) presentar ese id en estas RPC (gateadas sólo por un p_admin_clerk_id
--      forjable) y volcar el padrón: nombres + emails + actividad.
-- Estas RPC ahora se invocan SOLO por el gateway verificado `admin-action`
-- (service_role, tras verificar el token de Clerk del admin → inyecta el id
-- admin verificado, ignora el del body). Se revoca de PUBLIC/anon/authenticated.
--
-- ⚠️ ORDEN: correr SOLO después de (a) desplegar `admin-action` v1.6 y
-- (b) confirmar que el Motor de Intervención (Padrón / MI_Tripulantes,
-- detalle / MI_Detail) carga por el gateway. Todas son WEB-ONLY (iOS no las
-- llama) → sin dependencia del build iOS.
--
-- get_tripulantes_membership_flags: SIN caller en el código → liability muerta,
-- se revoca sin migrar cliente.

DO $$
DECLARE
    r record;
    names text[] := ARRAY[
        'get_profiles_no_scan',
        'get_tripulantes_scan_activity',
        'get_tripulantes_signup_dates',
        'get_tripulantes_gift_flags',
        'get_tripulantes_email_flags',
        'get_tripulantes_membership_flags',
        'get_email_subscription_status',
        'get_email_dispatch_status'
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
