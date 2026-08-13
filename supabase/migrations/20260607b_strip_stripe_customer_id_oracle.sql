-- Red Solar Viva · Ola C · Fase 0 — Redacción de stripe_customer_id del oráculo
-- =====================================================================
-- get_profile_by_clerk_id (creada en el Dashboard, fuera del repo) devolvía la
-- fila COMPLETA de profiles a cualquiera con la anon key (RETURNS profiles +
-- SELECT *). Entre las columnas viajaba stripe_customer_id, que alimentaba el
-- IDOR de facturación de create-portal-session: un atacante leía el customer_id
-- de cualquier Tripulante y abría su portal de Stripe.
--
-- Fase 0 (quick-win, riesgo cero): se mantiene la MISMA firma y el MISMO tipo de
-- retorno (profiles) → CREATE OR REPLACE sin DROP, sin tocar a los ~18
-- llamadores — pero se redacta stripe_customer_id a NULL antes de devolver. El
-- resto del comportamiento (objeto all-null en no-match, detección de is_admin)
-- queda idéntico: la asignación a un campo materializa la fila de nulls igual
-- que antes, y los callers usan `?.is_admin` (robusto a null vs {is_admin:null}).
--
-- La eliminación del oráculo de is_admin/email se hace en la Fase 2 (edge `me`
-- verificada + REVOKE anon), NO acá.
--
-- Definición ORIGINAL (respaldo / cierre del blindspot Dashboard-only):
--   CREATE OR REPLACE FUNCTION public.get_profile_by_clerk_id(p_clerk_id text)
--    RETURNS profiles LANGUAGE sql STABLE SECURITY DEFINER
--   AS $$ SELECT * FROM public.profiles WHERE clerk_user_id = p_clerk_id LIMIT 1; $$;

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

    -- Redacción: nunca exponer el id de cliente de Stripe por esta vía.
    -- (Asignar el campo también materializa la fila all-null en no-match,
    --  preservando el shape exacto que ya consumían los callers.)
    r.stripe_customer_id := NULL;

    RETURN r;
END;
$function$;
