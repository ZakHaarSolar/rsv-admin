-- Red Solar Viva · AUDITORÍA 2026-07-24 · PARTE 2 · HALLAZGO CRÍTICO
-- Borrado del editor del Motor + historial de ingresos
-- =============================================================================
-- ORDEN OBLIGATORIO:
--   1) supabase functions deploy admin-action --no-verify-jwt      (v1.42)
--   2) publicar Code/MI_Editores.tsx v1.32 (🔄 PASTE MANUAL: 325KB) y
--      Code/TN_Shared.tsx v1.5
--   3) recién entonces pegar ESTE archivo.
-- Si se pega antes, el Motor pierde los botones de borrar/reordenar del editor
-- y la Telemetría pierde la gráfica de ingresos.
--
-- ── QUÉ CIERRA ────────────────────────────────────────────────────────────────
-- A) EL BORRADO DEL EDITOR — lo que 20260724c dejó fuera.
--    Aquella migración cerró get_all_sondas, get_all_protocolos_admin,
--    upsert_sonda y upsert_protocolo_admin, pero NO las tres funciones de
--    borrado/reorden. Verificado EN VIVO con la sola llave pública anon:
--        POST /rest/v1/rpc/delete_sonda           → {"success":true,"deleted":"…"}
--        POST /rest/v1/rpc/delete_protocolo_admin → {"success":true,"deleted":"…"}
--        POST /rest/v1/rpc/reorder_sondas         → {"success":true,…}
--    SIN ningún chequeo de admin en el cuerpo. Cualquiera con la anon key (que
--    viaja en el bundle de la app y de la web) podía borrar, una por una, las
--    36 sondas del Escáner y las 60 fases de Calibración (contenido de paga), y
--    desordenar el flujo de un pilar. Es destrucción del instrumento central y
--    es IRREVERSIBLE: el proyecto está en plan Free, que NO tiene backups
--    diarios (ver Pendientes vivos § SUPABASE).
--
-- B) EL HISTORIAL DE INGRESOS.
--    get_revenue_history no recibe ningún identificador —solo p_months—, así
--    que la RPC no puede gatear por sí misma. Verificado en vivo: devolvía a
--    anon la facturación mensual real (etiqueta, total, códices, inmersión).
--    Al no haber parámetro de identidad, el único gate posible es el gateway.
--
-- Ninguna de las cuatro la llama escaner-app → NO requiere build de iOS.

DO $$
DECLARE
    fn   text;
    args text;
    n    int := 0;
BEGIN
    FOREACH fn IN ARRAY ARRAY[
        'delete_sonda',
        'delete_protocolo_admin',
        'reorder_sondas',
        'get_revenue_history'
    ] LOOP
        FOR args IN
            SELECT pg_get_function_identity_arguments(p.oid)
            FROM pg_proc p
            JOIN pg_namespace n2 ON n2.oid = p.pronamespace
            WHERE n2.nspname = 'public' AND p.proname = fn
        LOOP
            EXECUTE format(
                'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                fn, args);
            EXECUTE format(
                'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',
                fn, args);
            n := n + 1;
            RAISE NOTICE 'cerrada: %(%)', fn, args;
        END LOOP;
    END LOOP;
    IF n = 0 THEN
        RAISE WARNING 'No se cerró ninguna firma — revisa que los nombres existan.';
    ELSE
        RAISE NOTICE 'Total de firmas cerradas: %', n;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
--   python3 admin/audit_verify.py
--     delete_sonda / delete_protocolo_admin / reorder_sondas / get_revenue_history
--     deben pasar a http=401 (permission denied).
--   En el Motor: el editor de Sondas y Calibraciones debe seguir borrando y
--   reordenando, y la Telemetría debe seguir pintando la gráfica de ingresos.
--   Si algo de eso deja de funcionar → faltó el paso 1 o el 2.
-- ═════════════════════════════════════════════════════════════════════════════
