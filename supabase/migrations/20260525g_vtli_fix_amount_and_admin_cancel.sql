-- ═══════════════════════════════════════════════════════════════════════════
-- Veo Tu Luz Interna · Fix monto x3 + RPC admin cancel
-- 20260525g_vtli_fix_amount_and_admin_cancel.sql
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
--
-- 1. vtli_manage_get_booking — el `amount_mxn_cents` que se guarda en cada
--    fila YA es el total del ciclo (333300 = 3,333 MXN para un ciclo de 3
--    sesiones). El RPC anterior lo multiplicaba por sessions_count → daba
--    9,999 erróneo. Ahora se devuelve directo.
-- 2. vtli_admin_cancel_booking — nuevo RPC con admin gate (profiles.is_admin)
--    para que el Observatorio · Presenciales pueda eliminar/cancelar un
--    ciclo entero. El trigger vtli_update_slot_count libera reserved_count
--    automáticamente al pasar a 'cancelada'.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Patch del RPC público vtli_manage_get_booking ───────────────────────────
CREATE OR REPLACE FUNCTION vtli_manage_get_booking(
    p_manage_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result          JSON;
    v_first_dt        TIMESTAMP;
    v_hours_to_first  NUMERIC;
    v_now_local       TIMESTAMP;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM vtli_reservas
        WHERE manage_token = p_manage_token
    ) THEN
        RETURN json_build_object('exists', false);
    END IF;

    v_now_local := (NOW() AT TIME ZONE 'America/Cancun')::TIMESTAMP;

    SELECT (s.slot_date + s.slot_time)::TIMESTAMP
        INTO v_first_dt
        FROM vtli_reservas r
        JOIN vtli_slots s ON s.id = r.slot_id
        WHERE r.manage_token = p_manage_token
          AND r.status = 'confirmada'
          AND (s.slot_date + s.slot_time)::TIMESTAMP > v_now_local
        ORDER BY s.slot_date ASC, s.slot_time ASC
        LIMIT 1;

    IF v_first_dt IS NULL THEN
        v_hours_to_first := NULL;
    ELSE
        v_hours_to_first := EXTRACT(EPOCH FROM (v_first_dt - v_now_local)) / 3600.0;
    END IF;

    SELECT json_build_object(
        'exists', TRUE,
        'permite_cambios',
            CASE
                WHEN v_hours_to_first IS NULL THEN FALSE
                WHEN v_hours_to_first >= 48 THEN TRUE
                ELSE FALSE
            END,
        'hours_to_first_slot', v_hours_to_first,
        'ciclo', json_build_object(
            'ciclo_group_id', MIN(r.ciclo_group_id::TEXT),
            'pilar_id', MIN(r.pilar_id),
            'sessions_count', MIN(r.sessions_count),
            'nombre', MIN(r.nombre),
            'email', MIN(r.email),
            'telefono', MIN(r.telefono),
            'is_for_child', BOOL_OR(r.is_for_child),
            'child_name', MIN(r.child_name),
            'child_age', MIN(r.child_age),
            -- Fix: cada fila ya guarda el total del ciclo. NO multiplicar.
            'amount_total_mxn_cents', MIN(r.amount_mxn_cents),
            'overall_status',
                CASE
                    WHEN BOOL_AND(r.status = 'cancelada') THEN 'cancelada'
                    WHEN BOOL_OR(r.status = 'confirmada') THEN 'confirmada'
                    ELSE MIN(r.status::TEXT)
                END
        ),
        'slots', (
            SELECT json_agg(
                json_build_object(
                    'reserva_id', r2.id::TEXT,
                    'slot_date', s2.slot_date,
                    'slot_time', s2.slot_time::TEXT,
                    'sequence', r2.sequence_in_ciclo,
                    'status', r2.status::TEXT,
                    'is_past',
                        ((s2.slot_date + s2.slot_time)::TIMESTAMP
                            <= v_now_local)
                )
                ORDER BY r2.sequence_in_ciclo
            )
            FROM vtli_reservas r2
            JOIN vtli_slots s2 ON s2.id = r2.slot_id
            WHERE r2.manage_token = p_manage_token
        )
    ) INTO v_result
    FROM vtli_reservas r
    WHERE r.manage_token = p_manage_token;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_manage_get_booking(UUID)
    TO anon, authenticated, service_role;

-- 2. vtli_admin_cancel_booking — admin-only cancela ciclo + libera slots ────
-- El trigger vtli_update_slot_count ajusta reserved_count automáticamente al
-- pasar las filas a 'cancelada'.
CREATE OR REPLACE FUNCTION vtli_admin_cancel_booking(
    p_admin_clerk_id TEXT,
    p_ciclo_group_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cancelled INT;
BEGIN
    -- Admin gate
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND COALESCE(is_admin, FALSE) = TRUE
    ) THEN
        RAISE EXCEPTION 'Acceso restringido (no admin)';
    END IF;

    UPDATE vtli_reservas
        SET status = 'cancelada'
        WHERE ciclo_group_id = p_ciclo_group_id
          AND status IN ('pendiente', 'confirmada');
    GET DIAGNOSTICS v_cancelled = ROW_COUNT;

    RETURN json_build_object(
        'success', TRUE,
        'cancelled_count', v_cancelled,
        'ciclo_group_id', p_ciclo_group_id::TEXT
    );
END;
$$;

GRANT EXECUTE ON FUNCTION vtli_admin_cancel_booking(TEXT, UUID)
    TO anon, authenticated, service_role;

-- FIN ─────────────────────────────────────────────────────────────────────────
