-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Listado admin de reservas confirmadas
-- 20260525e_vtli_admin_list_bookings.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Crea el RPC `vtli_admin_list_bookings` con admin gate vía profiles.is_admin
-- para alimentar la pestaña "PRESENCIALES" del Observatorio de Resonancia.
-- Devuelve todas las reservas (filtradas por status) con sus datos de slot
-- y del Tutor — agrupables por ciclo_group_id en el frontend.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION vtli_admin_list_bookings(
    p_admin_clerk_id TEXT,
    p_status         TEXT DEFAULT 'confirmada',
    p_limit          INT  DEFAULT 500
)
RETURNS TABLE (
    reserva_id          UUID,
    ciclo_group_id      UUID,
    sequence_in_ciclo   INT,
    sessions_count      INT,
    pilar_id            TEXT,
    nombre              TEXT,
    email               TEXT,
    telefono            TEXT,
    is_for_child        BOOLEAN,
    child_name          TEXT,
    child_age           INT,
    slot_date           DATE,
    slot_time           TIME,
    status              TEXT,
    amount_mxn_cents    INT,
    confirmed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ,
    stripe_session_id   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- ── Admin gate ──
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND COALESCE(is_admin, FALSE) = TRUE
    ) THEN
        RAISE EXCEPTION 'Acceso restringido (no admin)';
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.ciclo_group_id,
        r.sequence_in_ciclo,
        r.sessions_count,
        r.pilar_id,
        r.nombre,
        r.email,
        r.telefono,
        r.is_for_child,
        r.child_name,
        r.child_age,
        s.slot_date,
        s.slot_time,
        r.status::TEXT,
        r.amount_mxn_cents,
        r.confirmed_at,
        r.created_at,
        r.stripe_session_id
    FROM vtli_reservas r
    JOIN vtli_slots    s ON s.id = r.slot_id
    WHERE
        CASE
            WHEN p_status IS NULL OR p_status = '' THEN TRUE
            WHEN p_status = 'todas'                THEN TRUE
            ELSE r.status::TEXT = p_status
        END
    ORDER BY s.slot_date ASC, s.slot_time ASC, r.sequence_in_ciclo ASC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_admin_list_bookings(TEXT, TEXT, INT)
    TO anon, authenticated, service_role;

-- FIN ─────────────────────────────────────────────────────────────────────────
