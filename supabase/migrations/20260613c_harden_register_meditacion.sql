-- Red Solar Viva · Barrido profundo 2026-06-13 — endurecer register_meditacion_inmersion_libre
-- =====================================================================
-- HALLAZGO (confirmado en vivo): la RPC otorgaba una Meditación (222 MXN c/u)
-- a CUALQUIER clerk_user_id SIN chequear membresía — el propio comentario de la
-- migración original decía "la valida el frontend". Con sólo la anon key un
-- anónimo se auto-otorgaba la meditación (http 200 {success:true}).
--
-- FIX: chequeo server-side de Inmersión Solar adentro de la función, reusando
-- get_my_membership_tier (que ya resuelve profiles→subscriptions). Build-safe:
--   · Los clientes (iOS + web) siguen llamando igual → un Tripulante Inmersión
--     real sigue canjeando sin cambio.
--   · El id sigue forjable, pero ahora es INOCUO: un id no-Inmersión es
--     rechazado, y forjar el id de un Inmersión sólo le escribe a ÉL (a quien
--     ya le corresponde) → no hay auto-otorgamiento. Por eso NO se hace REVOKE
--     (no rompe la app viva) y NO depende del build.

CREATE OR REPLACE FUNCTION public.register_meditacion_inmersion_libre(
    p_clerk_user_id text,
    p_meditacion_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing int;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_meditacion_id IS NULL OR p_meditacion_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'meditacion_id requerido');
    END IF;

    -- Gate server-side: SÓLO Inmersión Solar activa puede canjear libre.
    IF COALESCE(
         public.get_my_membership_tier(p_clerk_user_id) ->> 'tier', 'explorer'
       ) <> 'inmersion' THEN
        RETURN json_build_object('success', false, 'error', 'no_inmersion');
    END IF;

    SELECT count(*)::int INTO v_existing
    FROM public.meditaciones_owned
    WHERE clerk_user_id = p_clerk_user_id
      AND meditacion_id = p_meditacion_id;

    IF v_existing > 0 THEN
        RETURN json_build_object(
            'success', true,
            'already_registered', true
        );
    END IF;

    INSERT INTO public.meditaciones_owned
        (clerk_user_id, meditacion_id, acquired_via)
    VALUES
        (p_clerk_user_id, p_meditacion_id, 'inmersion_libre')
    ON CONFLICT (clerk_user_id, meditacion_id) DO NOTHING;

    RETURN json_build_object(
        'success', true,
        'already_registered', false
    );
END $$;

GRANT EXECUTE ON FUNCTION public.register_meditacion_inmersion_libre(text, text)
    TO anon, authenticated, service_role;

-- Limpieza de la fila basura que dejó la sonda de auditoría (usuario inexistente).
DELETE FROM public.meditaciones_owned
 WHERE clerk_user_id = 'user_AUDIT_PROBE_target_zzz'
   AND meditacion_id = '__audit_probe_noop__';
