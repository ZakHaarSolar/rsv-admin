-- ═══════════════════════════════════════════════════════════════════════
-- Fix firma duplicada del RPC get_citas_1to1_de_tripulante
--
-- PostgreSQL permite overload de funciones por firma. Al haber creado
-- originalmente `get_citas_1to1_de_tripulante(TEXT)` y después
-- `get_citas_1to1_de_tripulante(TEXT, TEXT)` con CREATE OR REPLACE, ambas
-- coexisten — y PostgREST responde 400 "Could not choose the best
-- candidate function" cuando el cliente manda un payload que matchea las
-- dos firmas.
--
-- Solución: DROP explícito de la firma vieja, después recrear la nueva
-- con 2 parámetros (el segundo DEFAULT NULL, así sirve con 1 o 2 args).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.get_citas_1to1_de_tripulante(TEXT);
DROP FUNCTION IF EXISTS public.get_citas_1to1_de_tripulante(TEXT, TEXT);

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
GRANT EXECUTE ON FUNCTION public.get_citas_1to1_de_tripulante(TEXT, TEXT) TO anon, authenticated;

COMMIT;
