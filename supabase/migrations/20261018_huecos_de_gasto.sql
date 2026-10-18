-- Red Solar Viva · 20261018_huecos_de_gasto.sql v1.0
-- =====================================================================
-- Cierra dos huecos que encontró la auditoría de precios del 2026-10-18
-- (Escaner Vibracional/Precios/AUDITORIA_PRECIOS_2026-10-18.md, sección 5):
--
-- 1. LAS 3 RESPUESTAS GRATIS DEL ESPEJO SE BRINCABAN CON MENSAJES SIMULTÁNEOS.
--    oraculo-chat leía `oraculo_usage.sent_count` al empezar y escribía
--    `sent_count = lo_leído + 1` al terminar. Diez mensajes mandados al mismo
--    tiempo leían todos 0, pasaban todos y el contador acababa en 1.
--    `reservar_cortesia_espejo` suma y verifica en un solo paso (la fila queda
--    bloqueada mientras se decide), así que de diez simultáneos pasan
--    exactamente los que caben. `devolver_cortesia_espejo` regresa la
--    respuesta cuando el turno no llegó a entregar nada.
--
-- 2. EL GOBERNADOR DE GASTO TAMPOCO TENÍA CANDADO.
--    reserve_edge_spend suma la ventana y luego escribe; dos llamadas
--    simultáneas de la misma persona podían sumar antes de que la otra
--    escribiera y pasar las dos. Ahora toma un candado por (función, persona)
--    que dura lo que dura la reserva. La firma no cambia: todas las funciones
--    que ya la llaman siguen igual.
--
-- Las funciones del servidor ya están desplegadas y funcionan sin esto (usan
-- el camino anterior mientras no exista); al pegarlo, el contador atómico se
-- enciende solo, sin volver a desplegar nada.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.
-- Se puede correr más de una vez sin duplicar nada.

-- ── 1 · El gobernador con candado ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reserve_edge_spend(
    p_edge                   text,
    p_user_key               text DEFAULT NULL,
    p_ip                     text DEFAULT NULL,
    p_cost                   int  DEFAULT 1,
    p_user_limit             int  DEFAULT 0,
    p_user_window_seconds    int  DEFAULT 3600,
    p_ip_limit               int  DEFAULT 0,
    p_ip_window_seconds      int  DEFAULT 3600,
    p_global_limit           int  DEFAULT 0,
    p_global_window_seconds  int  DEFAULT 86400
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ipkey   text := CASE WHEN p_ip IS NOT NULL AND length(p_ip) > 0 THEN md5(p_ip) ELSE NULL END;
    v_spent   bigint;
BEGIN
    -- Candado por (función, persona) o, sin persona, por (función, IP). Se
    -- suelta solo al terminar la reserva. Dos pedidos simultáneos de la misma
    -- persona se forman en fila: el segundo suma lo que el primero ya anotó.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(p_edge || '|' || COALESCE(p_user_key, v_ipkey, ''), 20261018)
    );

    -- Ventana por usuario
    IF p_user_limit > 0 AND p_user_key IS NOT NULL THEN
        SELECT COALESCE(SUM(cost_units),0) INTO v_spent
        FROM edge_spend_ledger
        WHERE user_key = p_user_key AND edge = p_edge
          AND created_at > now() - make_interval(secs => p_user_window_seconds);
        IF v_spent + p_cost > p_user_limit THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'user_limit', 'spent', v_spent, 'limit', p_user_limit);
        END IF;
    END IF;

    -- Ventana por IP
    IF p_ip_limit > 0 AND v_ipkey IS NOT NULL THEN
        SELECT COALESCE(SUM(cost_units),0) INTO v_spent
        FROM edge_spend_ledger
        WHERE ip_key = v_ipkey AND edge = p_edge
          AND created_at > now() - make_interval(secs => p_ip_window_seconds);
        IF v_spent + p_cost > p_ip_limit THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'ip_limit', 'spent', v_spent, 'limit', p_ip_limit);
        END IF;
    END IF;

    -- Ventana global (por edge)
    IF p_global_limit > 0 THEN
        SELECT COALESCE(SUM(cost_units),0) INTO v_spent
        FROM edge_spend_ledger
        WHERE edge = p_edge
          AND created_at > now() - make_interval(secs => p_global_window_seconds);
        IF v_spent + p_cost > p_global_limit THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'global_limit', 'spent', v_spent, 'limit', p_global_limit);
        END IF;
    END IF;

    -- Reservar (registrar el gasto). Con los tres límites en 0 no se revisa
    -- ninguna ventana: es el cobro diferido que siempre se anota (el resto del
    -- reflejo profundo y el dinero real de un turno, ver oraculo-chat v1.58).
    INSERT INTO edge_spend_ledger (user_key, ip_key, edge, cost_units)
    VALUES (p_user_key, v_ipkey, p_edge, p_cost);

    RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_edge_spend(text,text,text,int,int,int,int,int,int,int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_edge_spend(text,text,text,int,int,int,int,int,int,int)
    TO service_role;

-- ── 2 · Las respuestas gratis del Espejo, en un solo paso ───────────────
-- Con p_limite: suma 1 solo si quien escribe aún no llegó a ese número
-- (las 3 de cortesía). Sin p_limite (miembros): suma 1 siempre; es el mismo
-- contador de por vida que ya lleva cada cuenta.
-- Devuelve {ok:true, usados} o {ok:false, usados} si ya no quedaba.
CREATE OR REPLACE FUNCTION public.reservar_cortesia_espejo(
    p_clerk_user_id text,
    p_limite        int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usados int;
BEGIN
    IF p_clerk_user_id IS NULL OR length(p_clerk_user_id) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'usados', 0, 'motivo', 'sin_usuario');
    END IF;
    IF p_limite IS NOT NULL AND p_limite <= 0 THEN
        RETURN jsonb_build_object('ok', false, 'usados', 0);
    END IF;

    INSERT INTO oraculo_usage AS u (clerk_user_id, sent_count, updated_at)
    VALUES (p_clerk_user_id, 1, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET sent_count = u.sent_count + 1,
            updated_at = now()
        WHERE p_limite IS NULL OR u.sent_count < p_limite
    RETURNING sent_count INTO v_usados;

    IF v_usados IS NULL THEN
        SELECT sent_count INTO v_usados
        FROM oraculo_usage
        WHERE clerk_user_id = p_clerk_user_id;
        RETURN jsonb_build_object('ok', false, 'usados', COALESCE(v_usados, 0));
    END IF;

    RETURN jsonb_build_object('ok', true, 'usados', v_usados);
END;
$$;

-- Regresa una respuesta reservada cuando el turno no entregó nada (el
-- proveedor no contestó, la foto no se pudo leer, un tope frenó el turno).
-- Nunca baja de cero y no toca updated_at: esa fecha dice cuándo llegó la
-- última respuesta de verdad.
CREATE OR REPLACE FUNCTION public.devolver_cortesia_espejo(
    p_clerk_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usados int;
BEGIN
    UPDATE oraculo_usage
       SET sent_count = GREATEST(sent_count - 1, 0)
     WHERE clerk_user_id = p_clerk_user_id
    RETURNING sent_count INTO v_usados;
    RETURN jsonb_build_object('ok', v_usados IS NOT NULL, 'usados', COALESCE(v_usados, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.reservar_cortesia_espejo(text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.devolver_cortesia_espejo(text)      FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reservar_cortesia_espejo(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.devolver_cortesia_espejo(text)      TO service_role;

COMMENT ON FUNCTION public.reservar_cortesia_espejo(text, int) IS
'Suma 1 al contador de por vida del Espejo (oraculo_usage.sent_count) en un solo paso; con p_limite solo si quien escribe no lo alcanzó. La llama oraculo-chat con service_role ANTES de llamar al modelo (v1.58).';
COMMENT ON FUNCTION public.devolver_cortesia_espejo(text) IS
'Regresa 1 al contador del Espejo cuando el turno reservado no entregó respuesta. La llama oraculo-chat con service_role.';
