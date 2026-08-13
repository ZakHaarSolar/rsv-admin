-- Red Solar Viva · AUDITORÍA 2026-07-24 · PARTE 2 · IDOR admin: Suno + Códices
-- =============================================================================
-- ORDEN OBLIGATORIO:
--   1) supabase functions deploy admin-action --no-verify-jwt   (v1.41)
--   2) recién entonces pegar ESTE archivo en el SQL Editor.
-- Si se pega antes del deploy, el Atelier pierde los Códices de Luz (la v1.40
-- del gateway todavía no conoce esas dos acciones). El resto (Suno) no depende
-- del orden: sus 8 acciones ya estaban en la whitelist desde v1.33.
--
-- QUÉ CIERRA:
-- Diez RPC de administración GRANTed a `anon` que reciben la identidad del
-- admin COMO PARÁMETRO (`p_admin_clerk_id`). Sí tienen chequeo de admin dentro
-- —una sonda anon con un id falso devuelve {"error":"unauthorized"}— así que
-- hoy NO hay fuga abierta; el problema es que la identidad es FORJABLE: quien
-- conozca (o adivine) un clerk id de administrador ejecuta las diez con la sola
-- llave pública. Es exactamente el IDOR sistémico que la ola C cerró en 2026-06
-- para las demás familias; estas nacieron después (jul-2026) y quedaron fuera.
--
-- Lo que un atacante con un id de admin válido lograría hoy:
--   · leer el catálogo y las creaciones de Frecuencias Sonoras (get_suno_*)
--   · BORRAR piezas y álbumes (delete_suno_creation/set_admin)
--   · renombrar/activar/desagrupar álbumes (rename/set_active/ungroup)
--   · leer y BORRAR los Códices de Luz destilados (delete_codice_luz_admin)
--
-- POR QUÉ ES SEGURO CERRARLAS YA (verificado en el código de los paneles):
--   · Code/FrecuenciasSonoras.tsx usa un helper rpc() **gateway-only**: si no
--     hay token de Clerk devuelve un error legible y NUNCA cae a REST directo
--     (L141-163). Las 8 acciones Suno ya están en la whitelist de admin-action.
--   · Code/AT_ZakHaarCarrusel.tsx y Code/AT_EstudioManual.tsx usan el helper
--     gateway-first con fallback directo "transitorio … hasta el REVOKE"; con
--     admin-action v1.41 las dos acciones de Códices viajan por el gateway y el
--     fallback muere.
--   · escaner-app NO llama ninguna de las diez → NO requiere build de iOS.

DO $$
DECLARE
    fn   text;
    args text;
    n    int := 0;
BEGIN
    FOREACH fn IN ARRAY ARRAY[
        -- Frecuencias Sonoras (20260709c / 20260709d / 20260709e / 20260710)
        'get_suno_catalog_admin',
        'get_suno_creations_admin',
        'delete_suno_creation_admin',
        'delete_suno_set_admin',
        'rename_suno_set_admin',
        'set_suno_album_active_admin',
        'set_suno_produced_admin',
        'ungroup_suno_creation_admin',
        -- Códices de Luz (20260624_codices_luz)
        'get_codices_luz_admin',
        'delete_codice_luz_admin'
    ] LOOP
        -- Resuelve TODAS las firmas: varias tienen overloads de versiones
        -- previas (p.ej. get_suno_creations_admin con p_limit 40 y 60).
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
    RAISE NOTICE 'Total de firmas cerradas: %', n;
END $$;

NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN: las diez deben pasar a http=401 (permission denied).
--   python3 admin/audit_verify.py
-- Y en el panel: Motor → Frecuencias Sonoras debe seguir listando la Biblioteca,
-- y el Atelier debe seguir mostrando los Códices de Luz. Si el Atelier los
-- pierde, es que faltó el deploy de admin-action v1.41 (paso 1).
-- ═════════════════════════════════════════════════════════════════════════════
