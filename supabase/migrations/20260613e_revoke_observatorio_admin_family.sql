-- Red Solar Viva · Barrido profundo 2026-06-13 · Batch 3 — REVOKE de la familia Observatorio
-- =====================================================================
-- 7 RPC SECURITY DEFINER del Observatorio de Resonancia gateadas SÓLO por un
-- p_clerk_id / p_admin_clerk_id forjable. Con el id admin descubierto
-- (is_admin_caller) un anónimo podía: leer la destilación de un nodo y las citas
-- 1:1 (get_destilacion_nodo_admin, get_observatorio_1to1_admin), y REESCRIBIR
-- las preguntas 1:1, la telemetría de Cámara, los perfiles/alias de nodo, y
-- cancelar/listar reservas (upsert_*, vtli_admin_*). Ahora se invocan SÓLO por
-- el gateway verificado `admin-action` v1.8 (el id admin lo inyecta el server).
--
-- ⚠️ ORDEN: correr SOLO después de (a) desplegar `admin-action` v1.8 y
-- (b) confirmar que el Observatorio (Micro/Macro/Presenciales) carga por el
-- gateway. WEB-ONLY (iOS no las llama) → sin dependencia del build iOS.

DO $$
DECLARE
    r record;
    names text[] := ARRAY[
        'get_destilacion_nodo_admin',
        'get_observatorio_1to1_admin',
        'upsert_perfil_nodo_y_alias_admin',
        'upsert_preguntas_1to1_admin',
        'upsert_telemetria_camara_admin',
        'vtli_admin_list_bookings',
        'vtli_admin_cancel_booking'
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
