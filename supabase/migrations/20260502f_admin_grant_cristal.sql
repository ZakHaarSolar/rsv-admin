-- Red Solar Viva · admin_grant_cristal
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- RPC nueva para que un admin pueda regalar UN cristal individual a
-- cualquier Tripulante (Explorador, Sintonía, Inmersión — sin filtro
-- por tier). Ritualística: cada llamada inserta exactamente un cristal,
-- así el admin va sumándolos uno por uno desde el panel del nodo.
--
-- A diferencia de `emit_cristales_for_subscription`, NO tiene
-- idempotency por mes_lunar — el admin puede regalar varios cristales
-- del mismo tipo en el mismo mes. La idempotency natural del sistema
-- (canjear_cristal toma el más antiguo no canjeado) hace que cristales
-- regalados se acumulen disponibles hasta canjearse.
--
-- Origen del cristal: 'manual'. Eso lo distingue de cristales
-- emitidos por suscripción (sintonia/inmersion) en consultas futuras
-- de auditoría.
--
-- Returns: el id del cristal nuevo + nuevos conteos disponibles del
-- Tripulante (codice_count, meditacion_count) para que el frontend
-- refresque la card sin un round-trip adicional.

CREATE OR REPLACE FUNCTION public.admin_grant_cristal(
    p_admin_clerk_id  TEXT,
    p_target_clerk_id TEXT,
    p_tipo            TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cristal_id UUID;
    v_mes_lunar TEXT := to_char(now(), 'YYYY-MM');
    v_codice_count INT;
    v_meditacion_count INT;
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized'
        );
    END IF;

    /* Validar target existe. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_target_clerk_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tripulante no encontrado'
        );
    END IF;

    /* Validar tipo. */
    IF p_tipo NOT IN ('codice', 'meditacion') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'tipo inválido (codice|meditacion)'
        );
    END IF;

    /* Insertar cristal. */
    INSERT INTO public.cristales_extraccion
        (clerk_user_id, tipo, origen, mes_lunar)
    VALUES
        (p_target_clerk_id, p_tipo, 'manual', v_mes_lunar)
    RETURNING id INTO v_cristal_id;

    /* Conteos disponibles tras la inserción. */
    SELECT COUNT(*)::INT INTO v_codice_count
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_target_clerk_id
      AND tipo = 'codice'
      AND canjeado_at IS NULL;

    SELECT COUNT(*)::INT INTO v_meditacion_count
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_target_clerk_id
      AND tipo = 'meditacion'
      AND canjeado_at IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'cristal_id', v_cristal_id,
        'tipo', p_tipo,
        'mes_lunar', v_mes_lunar,
        'codice_count', v_codice_count,
        'meditacion_count', v_meditacion_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_cristal(TEXT, TEXT, TEXT)
    TO anon, authenticated;
