-- ═══════════════════════════════════════════════════════════════════════
-- 20260724c_lockdown_editor_rpcs.sql
-- Auditoría de seguridad 2026-07-24 · HALLAZGO CRÍTICO
--
-- Las 4 RPC del editor del Motor (sondas + calibraciones) quedaron
-- GRANTed a `anon` en 20260705_i18n_motor_bilingual_rpcs.sql (líneas 564,
-- 618, 644, 722) y NO tienen ningún chequeo de admin en su cuerpo. Son
-- SECURITY DEFINER, así que cualquiera con la anon key pública (que viaja
-- en el bundle del cliente) puede:
--
--   · get_all_sondas()            → leer las 36 sondas del Escáner (+ _en)
--   · get_all_protocolos_admin()  → leer las 60 fases de Calibración,
--                                    que son CONTENIDO DE PAGA (el paywall
--                                    que 20260608j cerró queda bypasseado)
--   · upsert_sonda(...)           → REESCRIBIR o INSERTAR cualquier sonda
--   · upsert_protocolo_admin(...) → REESCRIBIR o INSERTAR cualquier fase
--
-- Verificado EN VIVO con la anon key (2026-07-24):
--   get_all_protocolos_admin → HTTP 200, 60 fases completas
--   get_all_sondas           → HTTP 200, 36 sondas completas
--   upsert_sonda             → HTTP 200 (permiso concedido; con p_id
--                              inexistente actualizó 0 filas)
--   upsert_protocolo_admin   → HTTP 400 22P02 (permiso CONCEDIDO, solo
--                              falló el cast del parámetro)
--
-- Con p_id = NULL las dos upsert INSERTAN. Con un id real (obtenible de
-- get_all_sondas) SOBREESCRIBEN. Es defacement del instrumento central
-- de la app por cualquiera con la llave pública.
--
-- FIX: REVOKE total + ruteo por el gateway `admin-action` (que ya verifica
-- el token de Clerk contra el JWKS e impone is_admin). No hace falta
-- cambiar la firma de las funciones: admin-action admite idParam = null
-- (solo gatea, no inyecta).
--
-- ⚠️ ORDEN DE APLICACIÓN (importa):
--   1. Desplegar admin-action v1.40 (con las 4 en la whitelist).
--   2. Publicar Code/MotorDeIntervencion.tsx + Code/MI_Editores.tsx
--      migrados a adminAction().
--   3. Pegar ESTE SQL.
-- Si se pega este SQL antes de (1) y (2), el editor de Sondas y
-- Calibraciones del Motor deja de cargar y de guardar hasta que se
-- completen. NO afecta a la app de App Store: la app lee `sondas_config`
-- y las calibraciones por otras vías (get_libreria_protocolos), no por
-- estas 4 RPC. Verificado con grep sobre escaner-app/src: 0 llamadas.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    fn   text;
    args text;
BEGIN
    FOREACH fn IN ARRAY ARRAY[
        'get_all_sondas',
        'get_all_protocolos_admin',
        'upsert_sonda',
        'upsert_protocolo_admin'
    ]
    LOOP
        -- Recorre TODOS los overloads vivos de cada nombre (robusto a
        -- firmas viejas que hayan quedado colgadas de migraciones previas).
        FOR args IN
            SELECT pg_get_function_identity_arguments(p.oid)
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = fn
        LOOP
            EXECUTE format(
                'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;',
                fn, args
            );
            EXECUTE format(
                'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role;',
                fn, args
            );
            RAISE NOTICE 'lockdown: public.%(%)', fn, args;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- ── Verificación posterior (correr como anon, debe dar 401) ────────────
--   python3 admin/audit_verify.py
-- Las 4 deben aparecer como CLOSED ✓ en el bloque
-- "AUDITORÍA 2026-07-24 · editor del Motor".
