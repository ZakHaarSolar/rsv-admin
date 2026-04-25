-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Borrado total de datos del Escáner de un tripulante
--
-- El Arquitecto puede, desde el Motor de Intervención, eliminar por
-- completo los datos del Escáner Vibracional de un tripulante. El user
-- queda como "nuevo" — próxima entrada al escáner, ciclo desde cero.
--
-- Se borran tres tablas:
--   · scan_vibracional            (cada escaneo por pilar)
--   · sonda_progress              (progreso mid-survey)
--   · estado_tripulante_protocolos (protocolos activos)
-- NO se toca profiles (el tripulante sigue existiendo en Clerk + RSV),
-- NO se tocan reservas/subscriptions (membresías y sesiones intactas).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.delete_user_scan_data_admin(
    p_clerk_id        TEXT,
    p_target_clerk_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_scans    INT := 0;
    v_progress INT := 0;
    v_proto    INT := 0;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;

    IF p_target_clerk_id IS NULL OR LENGTH(TRIM(p_target_clerk_id)) = 0 THEN
        RETURN json_build_object('error', 'missing_target');
    END IF;

    /* Salvaguarda: no permitimos auto-borrado. Si el admin se auto-eliminó
       por error perdería sus propios datos y el gate admin seguiría pero
       quedaría con historial limpio sin querer. Mejor obligar a hacerlo
       manual con otro admin si alguna vez hace falta. */
    IF p_clerk_id = p_target_clerk_id THEN
        RETURN json_build_object('error','self_delete_blocked');
    END IF;

    DELETE FROM public.scan_vibracional
    WHERE clerk_user_id = p_target_clerk_id;
    GET DIAGNOSTICS v_scans = ROW_COUNT;

    DELETE FROM public.sonda_progress
    WHERE clerk_user_id = p_target_clerk_id;
    GET DIAGNOSTICS v_progress = ROW_COUNT;

    DELETE FROM public.estado_tripulante_protocolos
    WHERE clerk_user_id = p_target_clerk_id;
    GET DIAGNOSTICS v_proto = ROW_COUNT;

    RETURN json_build_object(
        'success',    TRUE,
        'deleted', json_build_object(
            'scan_vibracional',            v_scans,
            'sonda_progress',              v_progress,
            'estado_tripulante_protocolos', v_proto
        )
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_user_scan_data_admin(TEXT, TEXT) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
