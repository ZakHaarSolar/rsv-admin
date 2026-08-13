-- Red Solar Viva · Motor de Intervención — VIGENCIA de la Cortesía Solar
-- + AVANCE de sondas por pilar (detalle del nodo)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- (1) admin_get_gift_status v2 — el Motor decía "Cortesía Solar" activa
--     para siempre: la RPC v1 solo miraba status='active' + el id sintético
--     gift_sintonia_%, SIN mirar current_period_end. La app SÍ lo mira
--     (get_tripulante_extras / get_my_membership), así que un regalo vencido
--     dejaba al Tripulante en Explorador mientras el panel lo seguía viendo
--     con cortesía viva. Ahora `accepted` exige VIGENCIA y se suman las
--     fechas: cuándo se ofreció, cuándo la aceptó, hasta cuándo corre y
--     cuántos días le quedan (o hace cuánto venció).
--
-- (2) admin_get_user_sonda_progress — hasta dónde llegó el nodo en CADA
--     pilar del Radar (2 de 8, 7 de 8, sellado, sin iniciar) leyendo el
--     progreso in-flight (sonda_progress) + los totales vivos de
--     sondas_config + el ciclo del último escaneo. Sirve para ver si están
--     abandonando el escaneo y en qué pregunta.
--
-- Seguridad: ambas por gateway admin-action (p_admin_clerk_id inyectado del
-- token verificado). REVOKE anon/authenticated; solo service_role.

-- ── (1) Estado del regalo CON vigencia ────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_gift_status(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id uuid;
    v_pending    boolean := false;
    v_accepted   boolean := false;
    v_expired    boolean := false;
    v_started    timestamptz;
    v_ends       timestamptz;
    v_offered    timestamptz;
    v_claimed    timestamptz;
    v_days_left  int;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Regalo PENDIENTE: un gift_offer sin reclamar.
    v_pending := EXISTS (
        SELECT 1 FROM gift_offers
        WHERE clerk_user_id = p_target_clerk_id AND claimed_at IS NULL
    );

    -- Última invitación (pendiente o ya reclamada) para las fechas.
    SELECT created_at, claimed_at
    INTO v_offered, v_claimed
    FROM gift_offers
    WHERE clerk_user_id = p_target_clerk_id
    ORDER BY created_at DESC
    LIMIT 1;

    SELECT p.id INTO v_target_user_id
    FROM profiles p WHERE p.clerk_user_id = p_target_clerk_id LIMIT 1;

    IF v_target_user_id IS NOT NULL THEN
        /* La cortesía más reciente (vigente o no) — de ahí salen las
           fechas que ve el Motor. */
        SELECT s.current_period_start, s.current_period_end
        INTO v_started, v_ends
        FROM subscriptions s
        WHERE s.user_id = v_target_user_id
          AND s.status = 'active'
          AND s.stripe_subscription_id LIKE 'gift_sintonia_%'
        ORDER BY COALESCE(s.current_period_start, s.created_at) DESC NULLS LAST
        LIMIT 1;

        /* ACEPTADA = cortesía sintética activa Y VIGENTE (mismo criterio que
           usa la app: current_period_end NULL o en el futuro). */
        v_accepted := EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.user_id = v_target_user_id
              AND s.status = 'active'
              AND s.stripe_subscription_id LIKE 'gift_sintonia_%'
              AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
        );

        /* VENCIDA = hubo cortesía, ninguna sigue vigente. */
        v_expired := (NOT v_accepted) AND EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.user_id = v_target_user_id
              AND s.stripe_subscription_id LIKE 'gift_sintonia_%'
        );
    END IF;

    IF v_ends IS NOT NULL THEN
        v_days_left := CEIL(EXTRACT(EPOCH FROM (v_ends - NOW())) / 86400.0)::int;
    END IF;

    RETURN jsonb_build_object(
        'success',    true,
        'pending',    v_pending,
        'accepted',   v_accepted,
        'expired',    v_expired,
        'offered_at', v_offered,
        'claimed_at', v_claimed,
        'started_at', v_started,
        'expires_at', v_ends,
        'days_left',  v_days_left
    );
END;
$$;

-- ── (2) Avance de sondas por pilar ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_user_sonda_progress(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cycle_raw  text;
    v_cycle      jsonb := '[]'::jsonb;
    v_scan_at    timestamptz;
    v_scan       record;
    v_pilares    jsonb := '[]'::jsonb;
    v_row        record;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    /* Último escaneo: trae el ciclo vivo (qué pilares ya selló) + los
       puntajes. cycle_scanned_json es TEXT → se castea dentro de un bloque
       con EXCEPTION (nunca revienta la RPC si viniera con basura). */
    SELECT sv.created_at,
           sv.cycle_scanned_json::text AS cyc,
           sv.hardware_fisico, sv.procesador_mental, sv.motor_emocional,
           sv.gravedad_financiera, sv.vector_expansion, sv.orbita_relacional
    INTO v_scan
    FROM scan_vibracional sv
    WHERE sv.clerk_user_id = p_target_clerk_id
    ORDER BY sv.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        v_scan_at := v_scan.created_at;
        v_cycle_raw := v_scan.cyc;
        IF v_cycle_raw IS NOT NULL AND btrim(v_cycle_raw) <> '' THEN
            BEGIN
                v_cycle := v_cycle_raw::jsonb;
                IF jsonb_typeof(v_cycle) <> 'array' THEN
                    v_cycle := '[]'::jsonb;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                v_cycle := '[]'::jsonb;
            END;
        END IF;
    END IF;

    /* Un renglón por pilar: total de sondas activas, cuántas respondió,
       en qué pregunta se quedó y si ese pilar ya está sellado en el ciclo.
       sondas_config.pilar y sonda_progress.pilar viven en MAYÚSCULAS;
       el ciclo del escaneo guarda los ids en minúsculas. */
    FOR v_row IN
        SELECT
            LOWER(sc.pilar) AS pilar,
            COUNT(*)::int   AS total
        FROM sondas_config sc
        WHERE COALESCE(sc.is_active, true)
        GROUP BY LOWER(sc.pilar)
    LOOP
        v_pilares := v_pilares || jsonb_build_object(
            'pilar', v_row.pilar,
            'total', v_row.total,
            'answered', COALESCE((
                SELECT COUNT(*)::int
                FROM sonda_progress sp,
                     LATERAL jsonb_array_elements(sp.answers_json) e
                WHERE sp.clerk_user_id = p_target_clerk_id
                  AND LOWER(sp.pilar) = v_row.pilar
                  AND jsonb_typeof(e) = 'number'
            ), 0),
            'current_question', (
                SELECT sp.current_question
                FROM sonda_progress sp
                WHERE sp.clerk_user_id = p_target_clerk_id
                  AND LOWER(sp.pilar) = v_row.pilar
                LIMIT 1
            ),
            'updated_at', (
                SELECT sp.updated_at
                FROM sonda_progress sp
                WHERE sp.clerk_user_id = p_target_clerk_id
                  AND LOWER(sp.pilar) = v_row.pilar
                LIMIT 1
            ),
            'sealed', jsonb_exists(v_cycle, v_row.pilar),
            'score', CASE v_row.pilar
                WHEN 'fisico'     THEN v_scan.hardware_fisico
                WHEN 'mental'     THEN v_scan.procesador_mental
                WHEN 'emocional'  THEN v_scan.motor_emocional
                WHEN 'financiero' THEN v_scan.gravedad_financiera
                WHEN 'vector'     THEN v_scan.vector_expansion
                WHEN 'orbita'     THEN v_scan.orbita_relacional
                ELSE NULL
            END
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success',      true,
        'last_scan_at', v_scan_at,
        'cycle',        v_cycle,
        'cycle_size',   jsonb_array_length(v_cycle),
        'pilares',      v_pilares
    );
END;
$$;

-- Locks: solo service_role (gateway admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_gift_status(text, text)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_sonda_progress(text, text)  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_gift_status(text, text)          TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_get_user_sonda_progress(text, text)  TO service_role;
