-- Red Solar Viva · NOTIFICACIONES PUSH · Fase 1 — Tokens de dispositivo
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Guarda el token APNs/FCM de cada dispositivo del Tripulante para poder
-- enviarle notificaciones push (mensaje nuevo / Radar listo). El cliente
-- (escaner-app, @capacitor/push-notifications) registra su token al iniciar
-- sesión vía register_push_token, ruteada por el gateway user-action (inyecta
-- el clerk_user_id verificado del token de Clerk → el cliente NO puede forjar
-- a quién pertenece el token).
--
-- Seguridad: tabla RLS sin policies → solo service_role (el gateway) la toca,
-- vía las RPCs SECURITY DEFINER de abajo. REVOKE anon/authenticated.

-- ════════════════════════════════════════════════════════════════════
-- TABLAS
-- ════════════════════════════════════════════════════════════════════

-- Un dispositivo = un token. Un Tripulante puede tener varios (iPhone + iPad).
-- token es la PK: si un dispositivo cambia de dueño (raro: reinstalación con
-- otra cuenta), el upsert re-asigna el token al nuevo clerk_user_id → nunca se
-- le manda un push del nodo anterior.
CREATE TABLE IF NOT EXISTS public.push_tokens (
    token         text PRIMARY KEY,
    clerk_user_id text NOT NULL,
    platform      text NOT NULL DEFAULT 'ios',   -- 'ios' | 'android'
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens (clerk_user_id);

-- Dedupe del aviso "tu Radar está listo": una fila por (Tripulante, ciclo
-- completado). Evita re-notificar el mismo ciclo en corridas diarias del cron.
CREATE TABLE IF NOT EXISTS public.radar_ready_notified (
    clerk_user_id text NOT NULL,
    cycle_ts      timestamptz NOT NULL,
    notified_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, cycle_ts)
);

ALTER TABLE public.push_tokens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_ready_notified ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía service_role / RPCs SECURITY DEFINER.)

-- ════════════════════════════════════════════════════════════════════
-- RPCs DEL TRIPULANTE  (ruteadas por user-action; inyecta p_clerk_user_id)
-- ════════════════════════════════════════════════════════════════════

-- Registra (o re-asigna) el token del dispositivo al Tripulante actual.
CREATE OR REPLACE FUNCTION public.register_push_token(
    p_clerk_user_id text,
    p_token         text,
    p_platform      text DEFAULT 'ios'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token text := TRIM(COALESCE(p_token, ''));
    v_plat  text := LOWER(TRIM(COALESCE(p_platform, 'ios')));
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'no_user');
    END IF;
    IF length(v_token) = 0 THEN
        RETURN json_build_object('error', 'no_token');
    END IF;
    IF v_plat NOT IN ('ios', 'android') THEN v_plat := 'ios'; END IF;

    INSERT INTO push_tokens (token, clerk_user_id, platform, updated_at)
    VALUES (v_token, p_clerk_user_id, v_plat, now())
    ON CONFLICT (token) DO UPDATE
        SET clerk_user_id = EXCLUDED.clerk_user_id,
            platform      = EXCLUDED.platform,
            updated_at    = now();

    RETURN json_build_object('ok', true);
END;
$$;

-- Quita el token (cierre de sesión / opt-out). Solo borra si es tuyo.
CREATE OR REPLACE FUNCTION public.unregister_push_token(
    p_clerk_user_id text,
    p_token         text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM push_tokens
    WHERE token = TRIM(COALESCE(p_token, ''))
      AND clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('ok', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS — solo service_role (las llama user-action tras verificar el token).
-- ════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.register_push_token(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unregister_push_token(text, text)     FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.register_push_token(text, text, text) TO service_role;
GRANT  EXECUTE ON FUNCTION public.unregister_push_token(text, text)     TO service_role;
