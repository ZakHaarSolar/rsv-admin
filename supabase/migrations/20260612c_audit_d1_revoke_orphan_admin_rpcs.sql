-- Red Solar Viva · Auditoría pre-build · Iteración D-1 — REVOKE de RPCs admin sin caller cliente
-- =====================================================================================
-- HALLAZGO (A01 · escalada anon→admin, parte 1): la familia de RPCs admin del
-- 2026-04-24 tiene GRANT … TO anon y autoriza con `WHERE clerk_user_id =
-- p_admin_clerk_id AND is_admin`. Como el id admin es público-legible
-- (scan_vibracional anon + oráculo get_profile_by_clerk_id → is_admin), el gate
-- se DERROTA pasando un id admin cosechado. Probado en vivo: con el id admin
-- real, anon ejecutó get_observatorio_camara_admin (datos reales) y get_admin_dashboard
-- (financieros). NINGUNA está en una migración de REVOKE previa.
--
-- ESTAS 11 NO tienen NINGÚN llamador en el cliente (verificado por grep en Code/ +
-- escaner-app/). El único caller real es la edge destilar-nodo (save_destilacion_nodo)
-- que usa service_role → conserva EXECUTE. Por eso son CERRABLES YA, sin migrar nada.
-- (Las 7 que SÍ tienen caller cliente —get_tripulante_extras, get_admin_dashboard,
-- get_1to1_revenue_summary, get_observatorio_camara_admin, get_alias_nodos_sesion_admin,
-- list_analisis_profundo_admin, delete_user_scan_data_admin— van en D-2, DESPUÉS de
-- migrar los paneles al gateway admin-action.)
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

DO $$
DECLARE
    r record;
    targets text[] := ARRAY[
        'get_expediente_nodo_admin',
        'upsert_nota_nodo_admin',
        'insert_telemetria_camara',
        'upsert_telemetria_camara',
        'get_analisis_profundo_admin',
        'save_analisis_profundo_admin',
        'delete_analisis_profundo_admin',
        'get_destilacion_nodo',
        'save_destilacion_nodo',
        'get_decoder_scans_total',
        'get_decoder_scans_by_day'
    ];
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure::text AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(targets)
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', r.sig);
        EXECUTE format('GRANT  EXECUTE ON FUNCTION %s TO service_role;', r.sig);
        RAISE NOTICE 'Locked %', r.sig;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
