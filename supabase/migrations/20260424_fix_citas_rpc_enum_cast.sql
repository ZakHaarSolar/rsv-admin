-- ═══════════════════════════════════════════════════════════════════════
-- Fix RPC get_citas_1to1_de_tripulante · cast ENUM → TEXT para LIKE
--
-- `asientos_reservados.slot_type` es un tipo ENUM (slot_type_enum), no TEXT.
-- El operador LIKE (`~~` en pg) no existe para ENUM. Hay que castear al
-- vuelo con `::text` para que el patrón 'individual_%' funcione.
--
-- Mismo fix se aplica a `get_observatorio_1to1_admin` que usa el mismo
-- patrón LIKE sobre slot_type.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.get_citas_1to1_de_tripulante(
    p_clerk_user_id TEXT,
    p_email         TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
BEGIN
    IF p_clerk_user_id IS NULL AND v_email = '' THEN
        RETURN '[]'::json;
    END IF;

    RETURN COALESCE((
        SELECT json_agg(row_to_json(c) ORDER BY c.start_time)
        FROM (
            SELECT
                r.id                    AS reserva_id,
                r.status,
                r.confirmed_at,
                r.name,
                r.email,
                r.amount_mxn_cents,
                r.zoom_join_url,
                r.zoom_meeting_id,
                r.zoom_password,
                r.zoom_used_fallback,
                r.escaneo_resultado,
                r.intencion_texto,
                r.escaneo_completado_at,
                a.id                    AS slot_id,
                a.slot_type,
                a.start_time,
                a.end_time
            FROM public.reservas r
            INNER JOIN public.asientos_reservados a ON a.id = r.asiento_id
            WHERE r.status = 'confirmada'
              AND a.slot_type::text LIKE 'individual_%'
              AND a.start_time >= NOW() - INTERVAL '2 hours'
              AND (
                    (p_clerk_user_id IS NOT NULL AND r.clerk_user_id = p_clerk_user_id)
                    OR
                    (v_email <> '' AND LOWER(r.email) = v_email)
              )
            ORDER BY a.start_time ASC
        ) c
    ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_citas_1to1_de_tripulante(TEXT, TEXT) TO anon, authenticated, service_role;

-- También el RPC del admin tiene el mismo LIKE sobre slot_type
CREATE OR REPLACE FUNCTION public.get_observatorio_1to1_admin(
    p_clerk_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN json_build_object(
        'citas', COALESCE((
            SELECT json_agg(row_to_json(c) ORDER BY c.start_time)
            FROM (
                SELECT
                    r.id                 AS reserva_id,
                    r.name,
                    r.email,
                    r.clerk_user_id,
                    r.status,
                    r.confirmed_at,
                    r.amount_mxn_cents,
                    r.zoom_join_url,
                    r.zoom_meeting_id,
                    r.zoom_used_fallback,
                    r.escaneo_resultado,
                    r.intencion_texto,
                    r.escaneo_completado_at,
                    a.slot_type,
                    a.start_time,
                    a.end_time
                FROM public.reservas r
                INNER JOIN public.asientos_reservados a ON a.id = r.asiento_id
                WHERE r.status = 'confirmada'
                  AND a.slot_type::text LIKE 'individual_%'
                  AND a.start_time >= NOW() - INTERVAL '6 hours'
                ORDER BY a.start_time ASC
                LIMIT 50
            ) c
        ), '[]'::json),
        'preguntas', (SELECT public.get_preguntas_1a1_activas())
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_observatorio_1to1_admin(TEXT) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
