-- Red Solar Viva · Ola B leftover (paso 3) — RPCs del radar (scan_vibracional)
-- =====================================================================
-- scan_vibracional tenía lectura+escritura abiertas a anon con un
-- clerk_user_id forjable → cualquiera con la anon key podía leer/escribir
-- los puntajes de otro Tripulante (baja sensibilidad — puntajes propios,
-- sin PII). Estas 2 RPC mueven el acceso al canal verificado `user-action`
-- (gateUser → inyecta el p_clerk_user_id del token de Clerk verificado).
--
-- Tipos confirmados vía esquema en vivo: scores + indice_silicio = int;
-- cycle_scanned_json = text (guarda un JSON string); last_update_* = timestamptz.
--
-- GRANT solo a service_role: las llama exclusivamente el gateway user-action.
-- El REVOKE de la TABLA (RLS) va en un archivo aparte, post-build-live.

-- ── 1) Guardar un scan (insert) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_scan_vibracional(
    p_clerk_user_id text,
    p_hardware_fisico int,
    p_procesador_mental int,
    p_motor_emocional int,
    p_gravedad_financiera int,
    p_vector_expansion int,
    p_orbita_relacional int,
    p_indice_silicio int,
    p_cycle_scanned_json text,
    p_last_update_fisico timestamptz DEFAULT NULL,
    p_last_update_mental timestamptz DEFAULT NULL,
    p_last_update_emocional timestamptz DEFAULT NULL,
    p_last_update_financiero timestamptz DEFAULT NULL,
    p_last_update_vector timestamptz DEFAULT NULL,
    p_last_update_orbita timestamptz DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RAISE EXCEPTION 'clerk_user_id requerido' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.scan_vibracional (
        clerk_user_id,
        hardware_fisico, procesador_mental, motor_emocional,
        gravedad_financiera, vector_expansion, orbita_relacional,
        indice_silicio, cycle_scanned_json,
        last_update_fisico, last_update_mental, last_update_emocional,
        last_update_financiero, last_update_vector, last_update_orbita
    ) VALUES (
        p_clerk_user_id,
        p_hardware_fisico, p_procesador_mental, p_motor_emocional,
        p_gravedad_financiera, p_vector_expansion, p_orbita_relacional,
        p_indice_silicio, p_cycle_scanned_json,
        p_last_update_fisico, p_last_update_mental, p_last_update_emocional,
        p_last_update_financiero, p_last_update_vector, p_last_update_orbita
    );

    RETURN json_build_object('success', true);
END $$;

-- ── 2) Leer el historial propio (array desc, limit acotado) ──────────
-- Devuelve el MISMO shape que el SELECT REST (array de filas completas).
-- El cliente usa [0] como "último scan" y filtra/recorta el resto.
CREATE OR REPLACE FUNCTION public.get_my_scan_history(
    p_clerk_user_id text,
    p_limit int DEFAULT 120
) RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        json_agg(row_to_json(t) ORDER BY t.created_at DESC),
        '[]'::json
    )
    FROM (
        SELECT *
        FROM public.scan_vibracional
        WHERE clerk_user_id = p_clerk_user_id
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 120), 200))
    ) t;
$$;

-- ── Grants: solo el gateway (service_role) las invoca ────────────────
REVOKE ALL ON FUNCTION public.save_scan_vibracional(
    text, int, int, int, int, int, int, int, text,
    timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_scan_vibracional(
    text, int, int, int, int, int, int, int, text,
    timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz
) TO service_role;

REVOKE ALL ON FUNCTION public.get_my_scan_history(text, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_scan_history(text, int) TO service_role;
