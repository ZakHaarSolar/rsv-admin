-- ═══════════════════════════════════════════════════════════════════════════
-- VTLI · Confirm RPC defensivo + recuperación de END to END
-- 20260525h_vtli_confirm_rpc_defensive.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Contexto del bug:
--   El webhook Stripe llegaba a Pipedream Compras.js dentro del hold de 5 min
--   y llamaba a `vtli_confirm_booking_by_session(session_id, amount_total)`.
--   El RPC anterior devolvía sessions_confirmed: 0 a pesar de que las filas
--   estaban en 'pendiente' con stripe_session_id matchea exacto. Resultado:
--   correo cristalino sin FECHAS ANCLADAS, panel Presenciales vacío, botón
--   Gestionar mi cita ausente.
--
-- Cambios:
--   1. `#variable_conflict use_column` al inicio del body PL/pgSQL — elimina
--      ambigüedad entre los 13 nombres del RETURNS TABLE y las columnas reales
--      de vtli_reservas (ciclo_group_id, slot_date, slot_time, pilar_id, etc).
--   2. UPDATE usa nombre de tabla completo (`vtli_reservas.X`) en lugar de
--      alias `r.X`, doble seguro contra el shadowing.
--   3. CASE WHEN reemplaza COALESCE para `amount_mxn_cents` — cupones 100%
--      off mandan `amount_total = 0` desde Stripe; ahora 0 se trata como
--      "no actualizar" en lugar de sobre-escribir el monto del ciclo.
--   4. RAISE NOTICE con rows_affected del UPDATE — diagnóstico para futuros
--      casos (aparece en Supabase Dashboard → Database → Logs).
--   5. Aliases del SELECT cambiados a `vr` y `vs` para evitar cualquier
--      colisión residual con nombres del RETURNS TABLE.
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
    child_age           INT,
    manage_token        UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_rows_affected INT;
BEGIN
    UPDATE vtli_reservas
        SET status           = 'confirmada',
            confirmed_at     = NOW(),
            expires_at       = NULL,
            amount_mxn_cents = CASE
                WHEN p_amount_mxn_cents IS NOT NULL AND p_amount_mxn_cents > 0
                THEN p_amount_mxn_cents
                ELSE vtli_reservas.amount_mxn_cents
            END
        WHERE vtli_reservas.stripe_session_id = p_stripe_session_id
          AND vtli_reservas.status = 'pendiente';

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    RAISE NOTICE '[vtli_confirm] session=% rows_affected=%',
        p_stripe_session_id, v_rows_affected;

    RETURN QUERY
    SELECT
        vr.id            AS reserva_id,
        vr.ciclo_group_id,
        vs.slot_date,
        vs.slot_time,
        vr.sequence_in_ciclo,
        vr.sessions_count,
        vr.pilar_id,
        vr.nombre,
        vr.email,
        vr.telefono,
        vr.is_for_child,
        vr.child_name,
        vr.child_age,
        vr.manage_token
    FROM vtli_reservas vr
    JOIN vtli_slots vs ON vs.id = vr.slot_id
    WHERE vr.stripe_session_id = p_stripe_session_id
      AND vr.status = 'confirmada'
    ORDER BY vr.sequence_in_ciclo;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_confirm_booking_by_session(TEXT, INT)
    TO anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- RECUPERACIÓN END to END · resetea las 3 filas y las confirma
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Reset las 3 filas a 'pendiente' (reproduce el estado que tenían cuando
--    el webhook llegó originalmente, antes del auto-expire).
UPDATE vtli_reservas
    SET status = 'pendiente',
        confirmed_at = NULL,
        expires_at = NOW() + INTERVAL '1 hour'
    WHERE nombre = 'END to END';

-- 2) Llamar el confirm RPC con el session_id real del webhook (333300 cents
--    = 3,333 MXN reales del ciclo, ignorando el cupón 100% off).
SELECT * FROM vtli_confirm_booking_by_session(
    'cs_live_b1kgWYuB8IfhquYaopz7Y3sQdTuKaFpUZBkL96vz0HO89KgcYxiwtyK5t1',
    333300
);

-- 3) Verificar resultado final.
SELECT id, status, confirmed_at, sequence_in_ciclo, manage_token
FROM vtli_reservas
WHERE nombre = 'END to END'
ORDER BY sequence_in_ciclo;

-- FIN ─────────────────────────────────────────────────────────────────────────
