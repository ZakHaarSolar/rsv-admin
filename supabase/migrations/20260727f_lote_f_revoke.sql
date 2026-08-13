-- Red Solar Viva · LOTE F · SEGUNDA MITAD — el REVOKE
-- =====================================================================
-- ⚠️ NO PEGAR HASTA QUE LA VERSIÓN 1.1.3 ESTÉ **LIVE EN LA APP STORE**
--    (no basta con que esté compilada o en revisión: tiene que estar
--     disponible y en manos de los Tripulantes).
--
-- POR QUÉ: la app publicada 1.1.2 llama a estas dos RPC directo, con la
-- llave pública, sin pasar por ninguna vía verificada:
--
--   · MN_Codices        → get_profile_by_clerk_id  (lee .id para pedir
--                          los libros del Tripulante → "Mis Códices")
--   · Co_Shared         → get_my_membership        (muro de Códices)
--   · EV_Shared         → get_my_membership        (muros del Escáner,
--                          Decodificador de Alimentos y de Sueños)
--
-- Revocar antes de que 1.1.3 esté en circulación dejaría a los
-- Tripulantes de 1.1.2 sin biblioteca y, peor, SIN MEMBRESÍA DETECTADA:
-- quien pagó vería los muros de paga cerrados. Es un riesgo de producto
-- mayor que la fuga que cierra (severidad baja: enumerar si un correo
-- tiene membresía, sin devolver PII).
--
-- La FUGA GRAVE del oráculo (is_admin + correo + nombre) NO espera: ya
-- quedó cerrada por redacción en 20260727e, que sí es seguro pegar hoy.
-- Esto es defensa en profundidad.
--
-- ANTES DE PEGAR, confirmar las dos cosas:
--   1. 1.1.3 LIVE en App Store (y ojalá con adopción alta).
--   2. `python3 admin/audit_verify.py` → el bloque LOTE F sigue OPEN⏳.
-- DESPUÉS DE PEGAR, correr el verificador otra vez: los dos deben pasar
-- a CLOSED ✓. Si alguna app vieja se rompe, este archivo se revierte
-- volviendo a otorgar EXECUTE a anon (el GRANT del final, comentado).
-- =====================================================================

BEGIN;

-- ── A) El oráculo del perfil ──────────────────────────────────────────
-- Los 9 llamadores de cliente ya piden el perfil propio por el edge `me`
-- (el clerk id sale del token firmado). Los 8 `checkAdmin` que quedan
-- dentro de edge functions generativas son código muerto (declarados,
-- nunca llamados; todas usan gateAdmin) — verificado el 2026-07-27.
DO $$
DECLARE
    v_args text;
BEGIN
    SELECT pg_get_function_identity_arguments(p.oid) INTO v_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_profile_by_clerk_id'
    LIMIT 1;

    IF v_args IS NOT NULL THEN
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.get_profile_by_clerk_id(%s) FROM PUBLIC, anon, authenticated',
            v_args);
        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.get_profile_by_clerk_id(%s) TO service_role',
            v_args);
        RAISE NOTICE 'get_profile_by_clerk_id(%) cerrada a anon.', v_args;
    ELSE
        RAISE NOTICE 'get_profile_by_clerk_id no existe — nada que revocar.';
    END IF;
END $$;

-- ── B) La membresía por correo ────────────────────────────────────────
-- Los 5 llamadores de cliente ya piden la membresía por el gateway
-- `user-action` → get_my_membership_by_clerk (20260727e), que resuelve el
-- correo server-side contra profiles con el clerk id verificado.
--
-- 🜂 Sigue viva para el SERVIDOR: get_home_state y get_my_membership_by_clerk
--    la llaman por dentro. Ambas son SECURITY DEFINER, así que el permiso se
--    evalúa contra el dueño de la función, no contra anon → el REVOKE no las
--    rompe. Por eso se revoca el acceso, no se borra la función.
DO $$
DECLARE
    v_args text;
BEGIN
    SELECT pg_get_function_identity_arguments(p.oid) INTO v_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_my_membership'
    LIMIT 1;

    IF v_args IS NOT NULL THEN
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.get_my_membership(%s) FROM PUBLIC, anon, authenticated',
            v_args);
        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.get_my_membership(%s) TO service_role',
            v_args);
        RAISE NOTICE 'get_my_membership(%) cerrada a anon.', v_args;
    ELSE
        RAISE NOTICE 'get_my_membership no existe — nada que revocar.';
    END IF;
END $$;

COMMIT;

-- ── REVERSA DE EMERGENCIA (solo si una app vieja se rompe) ────────────
-- GRANT EXECUTE ON FUNCTION public.get_profile_by_clerk_id(text) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_my_membership(text)       TO anon, authenticated;
