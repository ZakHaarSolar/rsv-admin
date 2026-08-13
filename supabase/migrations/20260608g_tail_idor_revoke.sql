-- Red Solar Viva · Ola C — REVOKE anon de la cola IDOR de baja severidad
-- =====================================================================
-- 9 RPC "de datos propios" que estaban GRANT … TO anon y recibían un
-- clerk id forjable en el body → cualquiera con la anon key podía leer
-- (contador de cristales, nivel de membresía, meditaciones compradas,
-- progreso de lectura, consentimiento de IA) o escribir (consentimiento
-- de IA, progreso del juego Navegante) sobre OTRO Tripulante. Baja
-- severidad (sin PII / dinero / poder admin). Ahora se invocan SOLO por
-- el gateway verificado `user-action` (inyecta el clerk id del token).
--
-- ⚠️ Correr DESPUÉS de que la build iOS nueva (clientes migrados al
-- gateway) esté VIVA. Excepción: las 3 del Navegante son SOLO web
-- (NaveganteDeLaRed no tiene versión iOS) — esas son seguras de cerrar
-- apenas la web migrada sincronice, sin esperar la build. Requiere
-- además user-action v1.2 desplegado.

DO $$
DECLARE
    r record;
    names text[] := ARRAY[
        'get_my_cristales',
        'get_my_membership_tier',
        'get_my_meditaciones_owned',
        'get_ai_consent_at',
        'set_ai_consent_at',
        'get_my_reading_progress',
        'get_navegante_progress',
        'save_navegante_level',
        'clear_navegante_progress'
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
