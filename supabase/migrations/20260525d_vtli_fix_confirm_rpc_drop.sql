-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Fix DROP + CREATE del RPC de confirmación
-- 20260525d_vtli_fix_confirm_rpc_drop.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Postgres no permite cambiar el tipo de retorno de una función con
-- `CREATE OR REPLACE`. Hay que dropearla primero y volverla a crear.
-- Eso es lo único que hace este patch: drop + create del RPC con los
-- tres campos nuevos del menor (is_for_child, child_name, child_age).
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS vtli_confirm_booking_by_session(TEXT, INT);

CREATE OR REPLACE FUNCTION vtli_confirm_booking_by_session(
    p_stripe_session_id  TEXT,
    p_amount_mxn_cents   INT DEFAULT NULL
)
RETURNS TABLE (
    reserva_id          UUID,
    ciclo_group_id      UUID,
    slot_date           DATE,
    slot_time           TIME,
    sequence_in_ciclo   INT,
    sessions_count      INT,
    pilar_id            TEXT,
    nombre              TEXT,
    email               TEXT,
    telefono            TEXT,
    is_for_child        BOOLEAN,
    child_name          TEXT,
    child_age           INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE vtli_reservas r
        SET status = 'confirmada',
            confirmed_at = NOW(),
            expires_at   = NULL,
            amount_mxn_cents = COALESCE(p_amount_mxn_cents, r.amount_mxn_cents)
        WHERE r.stripe_session_id = p_stripe_session_id
          AND r.status = 'pendiente';

    RETURN QUERY
    SELECT
        r.id,
        r.ciclo_group_id,
        s.slot_date,
        s.slot_time,
        r.sequence_in_ciclo,
        r.sessions_count,
        r.pilar_id,
        r.nombre,
        r.email,
        r.telefono,
        r.is_for_child,
        r.child_name,
        r.child_age
    FROM vtli_reservas r
    JOIN vtli_slots s ON s.id = r.slot_id
    WHERE r.stripe_session_id = p_stripe_session_id
      AND r.status = 'confirmada'
    ORDER BY r.sequence_in_ciclo;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_confirm_booking_by_session(TEXT, INT)
    TO anon, authenticated, service_role;

-- FIN -------------------------------------------------------------------------
