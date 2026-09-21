-- Red Solar Viva · El faro de no-leídos del Motor (Zak 2026-08-30 · II)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- (Si aún no pegaste 20260830_mensajes_aliados.sql, pégala primero; esta
--  RPC igual funciona sin ella: reporta 0 aliados hasta que la tabla exista.)
--
-- Una sola lectura ligera que alimenta los números rojos de las pestañas
-- "Aliados" y "Soporte" del Motor de Intervención:
--   · aliados: mensajes de marcas (mensajes_aliados) sin leer.
--   · soporte: casos que esperan a la casa — status 'nuevo', o con algún
--     mensaje del Tripulante que nadie ha leído (aunque el caso esté
--     resuelto: si la persona volvió a escribir, cuenta).

CREATE OR REPLACE FUNCTION admin_get_unread_counts(
    p_admin_clerk_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_aliados INT := 0;
    v_soporte INT := 0;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    BEGIN
        SELECT COUNT(*) INTO v_aliados
        FROM mensajes_aliados
        WHERE leido = false;
    EXCEPTION WHEN undefined_table THEN
        v_aliados := 0;
    END;

    BEGIN
        SELECT COUNT(*) INTO v_soporte
        FROM support_tickets t
        WHERE t.status = 'nuevo'
           OR EXISTS (
                SELECT 1 FROM support_messages m
                WHERE m.ticket_id = t.id
                  AND m.autor = 'tripulante'
                  AND m.read_at IS NULL
           );
    EXCEPTION WHEN undefined_table THEN
        v_soporte := 0;
    END;

    RETURN json_build_object('aliados', v_aliados, 'soporte', v_soporte);
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_unread_counts(TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_unread_counts(TEXT)
    TO service_role;
