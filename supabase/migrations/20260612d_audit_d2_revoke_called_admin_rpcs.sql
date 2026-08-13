-- Red Solar Viva · Auditoría pre-build · Iteración D-2 — REVOKE de la familia admin con caller cliente
-- =====================================================================================
-- HALLAZGO (A01 · escalada anon→admin, parte 2 — LIVE-CONFIRMED): estas 7 RPCs
-- gateaban con un id admin PÚBLICO-legible (cosechable del oráculo
-- get_profile_by_clerk_id → is_admin). Probado en vivo con el id admin real:
--   · get_admin_dashboard{p_clerk_id:<admin>}  → 200 con los FINANCIEROS reales
--   · get_observatorio_camara_admin            → 200 con sesiones + PDFs reales
--   · list_analisis_profundo_admin             → 200 con análisis reales
--   (con un id NO-admin → "unauthorized": el gate solo distingue por el id, no
--    por token → se derrota con el id cosechado.)
-- Incluye la DESTRUCTIVA delete_user_scan_data_admin (borra datos de cualquiera).
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ⚠️ ORDEN OBLIGATORIO — NO pegar hasta:                                         │
-- │   1. Desplegar el gateway:  supabase functions deploy admin-action --no-verify-jwt │
-- │      (admin-action v1.5 ya tiene las 7 en su whitelist, inyectando el id admin │
-- │       VERIFICADO del token).                                                   │
-- │   2. Confirmar que la web sincronizó los 4 paneles (ya commiteados:            │
-- │      MI_Detail, MI_Tripulantes, ObservatorioResonanciaMacro, TN_Shared) —      │
-- │      llaman al gateway con fallback transitorio a la lectura directa.          │
-- │   Estos paneles son SOLO web (Framer); el build iOS vivo no los renderiza.     │
-- │   Si pegás esto ANTES del paso 1, los paneles caen al fallback directo y, ya   │
-- │   revocado, ese fallback dará 401 → el gateway es la única vía: por eso 1ro     │
-- │   el deploy.                                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- service_role conserva EXECUTE (lo usa el gateway admin-action). El doble gate
-- (gateway verifica is_admin + la RPC lo re-chequea) queda intacto.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

DO $$
DECLARE
    r record;
    targets text[] := ARRAY[
        'get_admin_dashboard',
        'get_1to1_revenue_summary',
        'delete_user_scan_data_admin',
        'get_tripulante_extras',
        'get_observatorio_camara_admin',
        'get_alias_nodos_sesion_admin',
        'list_analisis_profundo_admin'
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

-- Verificación post-run: anon con el id admin cosechado debe dar 401 permission
-- denied (no 200 con datos). El panel admin de Zak sigue funcionando por el gateway.
