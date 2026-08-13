-- Red Solar Viva · Barrido profundo (paso 1) — RPC del perfil propio
-- =====================================================================
-- `profiles` tenía lectura abierta a anon con un clerk_user_id forjable:
-- cualquiera con la anon key podía pedir
--   /rest/v1/profiles?clerk_user_id=eq.<víctima>&select=email,full_name
-- y leer el CORREO + NOMBRE de otro Tripulante (PII → alta severidad).
-- Único lector directo en ambos repos: el fallback de email/nombre que
-- dispara el correo CicloSellado al cerrar un ciclo 6/6 (EscanerVibracional).
--
-- Esta RPC mueve esa lectura al canal verificado `user-action`
-- (gateUser → inyecta el p_clerk_user_id del token de Clerk verificado),
-- así el Tripulante solo puede leer su PROPIO perfil.
--
-- Devuelve un objeto { email, full_name } (o NULL si no hay fila) — el
-- mismo dato que consumía el cliente.
--
-- GRANT solo a service_role: la llama exclusivamente el gateway user-action.
-- El REVOKE / RLS lock de la TABLA profiles (cerrar el SELECT anon directo)
-- va en el LOTE POST-BUILD-LIVE: la build iOS viva todavía lee profiles
-- directo, así que revocar ahora degradaría ese fallback en iOS. Antes de
-- ese lock hay que auditar el estado RLS vivo de profiles (el oráculo
-- get_profile_by_clerk_id y ensure_profile son SECURITY DEFINER → no los
-- afecta; el único acceso directo restante es este, ya migrado).

CREATE OR REPLACE FUNCTION public.get_my_profile_basics(
    p_clerk_user_id text
) RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT json_build_object(
        'email', email,
        'full_name', full_name
    )
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;
$$;

-- ── Grants: solo el gateway (service_role) la invoca ─────────────────
REVOKE ALL ON FUNCTION public.get_my_profile_basics(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_basics(text) TO service_role;
