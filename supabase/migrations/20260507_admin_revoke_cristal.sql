-- Red Solar Viva · admin_revoke_cristal
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- RPC nueva para que un admin pueda restar UN cristal individual a
-- cualquier Tripulante. Espejo de admin_grant_cristal — cada llamada
-- elimina exactamente un cristal disponible (canjeado_at IS NULL) del
-- tipo solicitado, así el admin va corrigiendo el balance uno por uno
-- desde el panel del nodo.
--
-- Estrategia LIFO: elimina el cristal MÁS RECIENTE no canjeado
-- (ORDER BY emitido_at DESC). El motivo es semántico: canjear_cristal
-- consume el más antiguo (FIFO); revoke saca el último que entró,
-- preservando los más antiguos para canjes legítimos. Si el último
-- emitido es de origen 'manual' (regalo de admin), se revoca primero;
-- así el admin puede deshacer su propio regalo sin tocar cristales
-- emitidos por suscripción.
--
-- Si no hay cristales disponibles del tipo, retorna error explícito.
-- Nunca toca cristales ya canjeados (canjeado_at IS NOT NULL): esos
-- registros son auditoría de uso y deben preservarse.
--
-- Returns: id del cristal eliminado + nuevos conteos disponibles del
-- Tripulante (codice_count, meditacion_count) para que el frontend
-- refresque la card sin un round-trip adicional.

CREATE OR REPLACE FUNCTION public.admin_revoke_cristal(
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

    /* Tomar el cristal más RECIENTE no canjeado del tipo solicitado.
       LIFO sobre la cola de cristales disponibles. */
    SELECT id INTO v_cristal_id
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_target_clerk_id
      AND tipo = p_tipo
      AND canjeado_at IS NULL
    ORDER BY emitido_at DESC NULLS LAST, id DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_cristal_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay cristales disponibles de ese tipo'
        );
    END IF;

    /* Eliminar el cristal seleccionado. Usamos DELETE en lugar de
       marcar canjeado_at porque el cristal nunca llegó al circuito
       de canje — es una corrección de balance, no un consumo. */
    DELETE FROM public.cristales_extraccion
    WHERE id = v_cristal_id;

    /* Conteos disponibles tras la eliminación. */
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

GRANT EXECUTE ON FUNCTION public.admin_revoke_cristal(TEXT, TEXT, TEXT)
    TO anon, authenticated;
