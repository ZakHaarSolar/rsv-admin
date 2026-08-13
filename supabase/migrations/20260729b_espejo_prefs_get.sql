-- =============================================================================
-- Red Solar Viva · 20260729b_espejo_prefs_get.sql
-- FASE 2 DEL CONTEXTO VIVO — el LECTOR de los interruptores del Espejo
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → pegar → Run.
-- Pareja: gateway `user-action` v1.44 (rutea get/set con el id verificado) +
--         MN_Firma (tarjeta "Espejo Vibracional" en Ajustes).
--
-- POR QUÉ: la migración 20260729 dejó el SETTER (set_espejo_context_prefs) pero
-- no un lector. Sin él, la tarjeta de Ajustes solo podría pintar desde el cache
-- del propio teléfono → al reinstalar o al entrar desde otro dispositivo los
-- interruptores mentirían. Esta RPC devuelve el estado REAL (o los defaults si
-- la persona nunca los tocó: campo SÍ, sueños NO).
--
-- 100% aditiva. No toca la tabla ni el setter ni la ficha.
--
-- 🜂 Misma regla de la joya de la corona: REVOKE total, SOLO service_role (el
-- gateway user-action, que ya verificó la sesión de Clerk, inyecta el id).
-- audit_verify.py la vigila junto a get_espejo_context / set_espejo_context_prefs.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_espejo_context_prefs(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_master boolean;
    v_dreams boolean;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        -- Sin identidad: los defaults. Nunca revienta la pantalla de Ajustes.
        RETURN json_build_object('master_enabled', true, 'dreams_enabled', false);
    END IF;

    BEGIN
        SELECT master_enabled, dreams_enabled
          INTO v_master, v_dreams
          FROM public.espejo_context_prefs
         WHERE clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN json_build_object(
        'master_enabled', COALESCE(v_master, true),
        'dreams_enabled', COALESCE(v_dreams, false)
    );
END $$;

REVOKE ALL ON FUNCTION public.get_espejo_context_prefs(text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_espejo_context_prefs(text) TO service_role;

-- 🜂 Un CREATE OR REPLACE re-otorga a PUBLIC lo que un REVOKE cerró: estas dos
-- se re-afirman acá por si alguna vez se re-crean en una migración futura.
REVOKE ALL ON FUNCTION public.get_espejo_context(text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_espejo_context(text) TO service_role;
REVOKE ALL ON FUNCTION public.set_espejo_context_prefs(text, boolean, boolean)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_espejo_context_prefs(text, boolean, boolean)
    TO service_role;
