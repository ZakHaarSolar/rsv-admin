-- 20260724_vision_sessions.sql
-- MURO DEL VISOR DE REALIDAD (Visión Decodificada, 4º sello del hub).
--
-- Regla: UNA sesión libre y completa por Tripulante (los dos lentes, foto y
-- video sin límite dentro de ella). El muro se levanta AL SALIR del lente esa
-- primera vez (el pico de emoción) y en cada intento posterior de abrirlo.
-- Quien tiene Sintonía Solar nunca ve muro.
--
-- La sesión se registra SOLO si fue real (capturó algo o vivió el campo >=12s):
-- salir a los 2 segundos no le quema su única oportunidad.
--
-- Espejo estructural de 20260610_dream_scans.sql. Diferencia importante: acá
-- NO hay edge que aplique el límite server-side, porque la capa corre 100%
-- on-device (ARKit + Metal, sin API paga). El servidor es la MEMORIA que cruza
-- devices y sobrevive un cierre de app; el gate lo aplica el cliente. El costo
-- de un bypass es cero (no gasta créditos de nadie).

CREATE TABLE IF NOT EXISTS public.vision_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Telemetría de la sesión (cuánto duró el campo, si guardó algo).
    seconds INT,
    captured BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_vision_sessions_user_date
    ON public.vision_sessions (clerk_user_id, created_at DESC);

ALTER TABLE public.vision_sessions ENABLE ROW LEVEL SECURITY;

-- Lectura cerrada: solo por la RPC SECURITY DEFINER (y esa solo por el
-- gateway user-action, que inyecta el clerk_user_id verificado del token).
DROP POLICY IF EXISTS insert_own_vision_session ON public.vision_sessions;
CREATE POLICY insert_own_vision_session ON public.vision_sessions
    FOR INSERT WITH CHECK (clerk_user_id IS NOT NULL);

-- ── RPCs ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_vision_session_count(
    target_clerk_id TEXT
)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(COUNT(*), 0)::INT
    FROM public.vision_sessions
    WHERE clerk_user_id = target_clerk_id;
$$;

CREATE OR REPLACE FUNCTION public.record_vision_session(
    p_clerk_user_id TEXT,
    p_seconds INT DEFAULT NULL,
    p_captured BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN NULL;
    END IF;
    INSERT INTO public.vision_sessions (clerk_user_id, seconds, captured)
    VALUES (p_clerk_user_id, p_seconds, COALESCE(p_captured, FALSE))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- Solo el gateway (service_role). anon/authenticated NO ejecutan: el id lo
-- pone el servidor desde el token verificado, nunca el cliente.
REVOKE ALL ON FUNCTION public.get_my_vision_session_count(TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_vision_session(TEXT, INT, BOOLEAN)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_vision_session_count(TEXT)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.record_vision_session(TEXT, INT, BOOLEAN)
    TO service_role;

REVOKE ALL ON public.vision_sessions FROM anon, authenticated;
