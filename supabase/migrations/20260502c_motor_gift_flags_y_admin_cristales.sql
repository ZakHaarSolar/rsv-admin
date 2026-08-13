-- Red Solar Viva · Motor · gift flags + admin_get_user_cristales
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Dos RPCs nuevas para enriquecer el panel del Motor de Intervención:
--
-- 1. `get_tripulantes_gift_flags`: devuelve los clerk_user_ids cuya
--    subscripción activa es una membresía REGALO (admin_activate_sintonia,
--    stripe_subscription_id LIKE 'gift_%'). El frontend lo usa para
--    distinguir visualmente "Cortesía Solar" en el grid de Nodos
--    Activos vs Sintonía Solar pagada.
--
-- 2. `admin_get_user_cristales`: como `get_my_cristales` pero el
--    caller (admin) consulta los cristales de OTRO Tripulante.
--    Devuelve `codice_count` y `meditacion_count` de cristales
--    disponibles (canjeado_at IS NULL). Sirve para mostrar en el
--    panel expandido cuántos cristales tiene el Tripulante.

DROP FUNCTION IF EXISTS public.get_tripulantes_gift_flags(TEXT);

CREATE OR REPLACE FUNCTION public.get_tripulantes_gift_flags(
    p_admin_clerk_id TEXT
)
RETURNS TABLE (clerk_user_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT DISTINCT p.clerk_user_id::TEXT
    FROM profiles p
    JOIN subscriptions s ON s.user_id = p.id
    WHERE s.status IN ('active', 'trialing')
      AND COALESCE(s.stripe_subscription_id, '') LIKE 'gift_%';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tripulantes_gift_flags(TEXT)
    TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.admin_get_user_cristales(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_get_user_cristales(
    p_admin_clerk_id TEXT,
    p_target_clerk_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_codice_count INT := 0;
    v_meditacion_count INT := 0;
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RETURN json_build_object('error', 'Unauthorized');
    END IF;

    IF p_target_clerk_id IS NULL OR p_target_clerk_id = '' THEN
        RETURN json_build_object(
            'codice_count', 0,
            'meditacion_count', 0
        );
    END IF;

    SELECT count(*)::INT INTO v_codice_count
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_target_clerk_id
      AND tipo = 'codice'
      AND canjeado_at IS NULL;

    SELECT count(*)::INT INTO v_meditacion_count
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_target_clerk_id
      AND tipo = 'meditacion'
      AND canjeado_at IS NULL;

    RETURN json_build_object(
        'codice_count', v_codice_count,
        'meditacion_count', v_meditacion_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_cristales(TEXT, TEXT)
    TO anon, authenticated, service_role;
