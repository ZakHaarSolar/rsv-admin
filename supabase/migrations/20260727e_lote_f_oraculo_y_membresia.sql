-- Red Solar Viva · AUDITORÍA · LOTE F — las 2 últimas puertas
-- =====================================================================
-- Cierra las dos superficies que quedaron OPEN⏳ desde el barrido de junio:
--
--   A) get_profile_by_clerk_id  → revelaba is_admin + correo + nombre a
--      cualquiera con la llave pública y un clerk id.
--   B) get_my_membership(email) → permite enumerar si un correo tiene
--      membresía activa (severidad baja: no devuelve PII, solo el booleano).
--
-- 🜂 POR QUÉ ACÁ NO HAY REVOKE (va en 20260727f, tras el build 1.1.3 LIVE):
--    La app PUBLICADA (1.1.2) llama a las DOS directo y sin respaldo:
--      · MN_Codices → get_profile_by_clerk_id (lee .id para pedir los libros)
--      · Co_Shared / EV_Shared → get_my_membership (los muros de paga)
--    Un REVOKE hoy dejaría a los Tripulantes de 1.1.2 sin "Mis Códices" y
--    sin membresía detectada. Por eso esta migración NO revoca nada: cierra
--    la FUGA hoy por redacción, y el REVOKE completo (defensa en profundidad)
--    viaja cuando 1.1.3 esté LIVE en la App Store.
--
-- Precedente exacto del patrón de redacción: 20260607b (stripe_customer_id).
-- Misma firma, mismo tipo de retorno, CREATE OR REPLACE sin DROP → los
-- llamadores no se enteran.
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- A) El oráculo deja de ser oráculo
-- ─────────────────────────────────────────────────────────────────────
-- Se redactan a NULL los campos que hacían del oráculo un problema:
--   · is_admin  → escalada de privilegio (descubrir QUIÉN es admin era el
--                 primer eslabón de la cadena anon→PII de la Parte 1)
--   · email     → PII directa
--   · full_name → PII directa
--   · avatar_url→ PII (foto del Tripulante)
--   (stripe_customer_id ya se redactaba desde 20260607b — se mantiene)
--
-- Lo que queda (id, clerk_user_id, timestamps, avatar_material/polarity,
-- ai_consent_at) no es sensible: para llegar acá ya hay que conocer el
-- clerk id, y son datos instrumentales sin valor para un atacante.
--
-- VERIFICADO antes de redactar (grep sobre el repo, 2026-07-27):
--   · Los 9 llamadores de cliente migraron al edge `me` (perfil propio
--     verificado contra el token firmado) — web ya desplegada.
--   · La app viva 1.1.2 solo necesita `.id` de esta vía (MN_Codices), y
--     su MN_Shared pide `me` PRIMERO (el oráculo era respaldo) → sigue OK.
--   · Los 8 `checkAdmin` que quedan dentro de edge functions generativas
--     están declarados pero NUNCA llamados (código muerto desde que la
--     Fase 3 de la Ola C los pasó a gateAdmin): menciones=1 declaraciones=1
--     en las 8, y gateAdmin presente en todas.
CREATE OR REPLACE FUNCTION public.get_profile_by_clerk_id(p_clerk_id text)
RETURNS public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
DECLARE
    r public.profiles;
BEGIN
    SELECT * INTO r
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_id
    LIMIT 1;

    -- Redacción (asignar también materializa la fila all-null en no-match,
    -- preservando el shape exacto que ya consumían los llamadores).
    r.stripe_customer_id := NULL;  -- 20260607b (IDOR de facturación)
    r.is_admin           := NULL;  -- Lote F: fin de la escalada de privilegio
    r.email              := NULL;  -- Lote F: PII
    r.full_name          := NULL;  -- Lote F: PII
    r.avatar_url         := NULL;  -- Lote F: PII

    RETURN r;
END;
$function$;

COMMENT ON FUNCTION public.get_profile_by_clerk_id(text) IS
'DEPRECADA (Lote F, 2026-07-27). El perfil propio se pide por el edge `me`, '
'que saca el clerk id del token firmado. Acá quedan redactados is_admin, '
'email, full_name, avatar_url y stripe_customer_id. Sigue viva solo para no '
'romper la app publicada 1.1.2 (MN_Codices lee .id). REVOKE en 20260727f, '
'cuando 1.1.3 esté LIVE.';


-- ─────────────────────────────────────────────────────────────────────
-- B) Membresía por clerk id (la vía nueva, para el gateway)
-- ─────────────────────────────────────────────────────────────────────
-- El problema de get_my_membership es que está keyed por CORREO, y el
-- gateway `user-action` inyecta el CLERK ID (del claim `sub` del token).
--
-- 🜂 Se descartó extraer el correo del token: el JWT de sesión de Clerk
--    trae `sub`, no el correo. Sumarlo exigiría tocar el JWT template en
--    el Dashboard de Clerk — configuración fuera del repo, que aplica a
--    TODOS los tokens del sistema, que se puede revertir sin dejar rastro
--    y que ningún verificador nuestro vigila.
--
-- 🜂 Se eligió resolver el correo SERVER-SIDE contra `profiles`, que es
--    exactamente lo que `get_home_state` ya hace desde el 2026-06-21
--    (20260621h, línea 33) y lleva un mes en producción. Replicar lo
--    probado en vez de inventar: el enlace clerk_id↔correo lo mantiene el
--    webhook de Clerk y es la fuente de verdad del sistema.
CREATE OR REPLACE FUNCTION public.get_my_membership_by_clerk(p_clerk_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_email text;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN jsonb_build_object('active', false);
    END IF;

    SELECT email INTO v_email
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    -- Reusa la lógica vigente (una sola fuente de verdad de "qué es activo").
    RETURN public.get_my_membership(COALESCE(v_email, ''));
END;
$function$;

-- Solo el gateway (service_role, tras verificar el token). Nunca anon.
REVOKE EXECUTE ON FUNCTION public.get_my_membership_by_clerk(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_membership_by_clerk(text)
    TO service_role;

COMMENT ON FUNCTION public.get_my_membership_by_clerk(text) IS
'Membresía del Tripulante keyed por clerk id (el correo se resuelve '
'server-side contra profiles). Se llama SOLO por el gateway user-action, '
'que inyecta el id verificado del token. Reemplaza a get_my_membership(email) '
'en los clientes. Patrón replicado de get_home_state (20260621h).';

COMMIT;
