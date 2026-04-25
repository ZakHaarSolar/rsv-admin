-- ═══════════════════════════════════════════════════════════════════════
-- Fix firma RPC get_citas_1to1_de_tripulante v2 · reload PostgREST cache
--
-- La corrida anterior de DROP+CREATE aparentemente dejó a PostgREST sin
-- ver la nueva función (404 al pegar /rest/v1/rpc). Esto pasa cuando el
-- schema cache de PostgREST no se recarga automáticamente tras un DROP.
-- Forzamos el reload con NOTIFY pgrst.
--
-- Además: DROP con CASCADE por si hay dependencias invisibles + volvemos
-- a crear la función desde cero, garantizando una sola firma activa.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Borrado defensivo (todas las firmas posibles)
DROP FUNCTION IF EXISTS public.get_citas_1to1_de_tripulante(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_citas_1to1_de_tripulante(TEXT, TEXT) CASCADE;

CREATE FUNCTION public.get_citas_1to1_de_tripulante(
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
              AND a.slot_type LIKE 'individual_%'
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

COMMIT;

-- Refrescar el schema cache de PostgREST (fuera de la transacción por seguridad).
-- Sin esto, el endpoint /rest/v1/rpc/... sigue devolviendo 404 aunque la
-- función exista en la base.
NOTIFY pgrst, 'reload schema';
