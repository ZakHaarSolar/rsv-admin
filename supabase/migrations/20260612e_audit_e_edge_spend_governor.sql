-- Red Solar Viva · Auditoría pre-build · Iteración E — Gobernador de gasto de edges pagas
-- =====================================================================================
-- HALLAZGO (A04 Insecure Design / Unrestricted Resource Consumption):
--   Las edges generativas pagas no tienen rate-limit ni budget-cap. Un miembro
--   (o un atacante con cuenta) podía martillar decode-matter/decode-dream (Gemini)
--   sin tope (M4), y extract-text gateaba el freemium pero NUNCA incrementaba el
--   contador → Cloud Vision gratis e ilimitado para no-miembros (M3).
--
-- Esta migración crea un LIBRO MAYOR de gasto + una RPC de "reserva" atómica que
-- cada edge llama (con el clerk_user_id VERIFICADO + la IP) ANTES de la llamada
-- paga. Si el usuario o la IP superan su ventana, devuelve {ok:false} → la edge
-- responde 429 sin gastar. El contador freemium de por-vida (decode_scans/
-- dream_scans) NO cambia: esto es una capa ADICIONAL anti-abuso que aplica también
-- a miembros.
--
-- Privacidad: la IP NO se guarda cruda — se almacena md5(ip) como ip_key.
-- Acceso: solo service_role (lo llaman las edges). RLS activo sin policies.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS edge_spend_ledger (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_key    text,
    ip_key      text,
    edge        text NOT NULL,
    cost_units  int  NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_esl_user   ON edge_spend_ledger (user_key, edge, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_esl_ip     ON edge_spend_ledger (ip_key, edge, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_esl_global ON edge_spend_ledger (edge, created_at DESC);

ALTER TABLE edge_spend_ledger ENABLE ROW LEVEL SECURITY;  -- sin policies → solo service_role

-- Reserva atómica: chequea las ventanas habilitadas (limit > 0) y, si pasa,
-- registra el gasto. Devuelve {ok:true} o {ok:false, reason, spent, limit}.
CREATE OR REPLACE FUNCTION reserve_edge_spend(
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
    v_spent   int;
BEGIN
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

    -- Reservar (registrar el gasto)
    INSERT INTO edge_spend_ledger (user_key, ip_key, edge, cost_units)
    VALUES (p_user_key, v_ipkey, p_edge, p_cost);

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- Solo las edges (service_role) la llaman.
REVOKE ALL ON FUNCTION reserve_edge_spend(text,text,text,int,int,int,int,int,int,int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_edge_spend(text,text,text,int,int,int,int,int,int,int)
    TO service_role;

-- Limpieza opcional (correr de vez en cuando o por cron): borra filas viejas.
--   DELETE FROM edge_spend_ledger WHERE created_at < now() - interval '7 days';
