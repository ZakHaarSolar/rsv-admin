-- ═══════════════════════════════════════════════════════════════════════
-- 🜂 LA HUELLA DEL BORRADO + LAS CONVERSACIONES VIVAS (Zak 2026-08-24)
-- ═══════════════════════════════════════════════════════════════════════
-- El panel decía "enviados 32" y no mostraba una sola conversación de esa
-- persona, y no había manera de saber por qué: el contador de enviados es un
-- acumulado que nunca baja, y las conversaciones se borran DE VERDAD cuando
-- el tripulante toca "Eliminar este reflejo".
--
-- Se guarda la HUELLA, nunca el contenido: cuándo borró y cuánto. Lo que la
-- persona decidió tirar se va igual que hoy.
--
-- Pégalo en Supabase → SQL Editor → New Query → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── (1) La huella ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oraculo_borrados (
    id              BIGSERIAL PRIMARY KEY,
    clerk_user_id   TEXT        NOT NULL,
    conversaciones  INT         NOT NULL DEFAULT 0,
    mensajes        INT         NOT NULL DEFAULT 0,
    borrado_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oraculo_borrados_user_idx
    ON public.oraculo_borrados (clerk_user_id, borrado_at DESC);

-- Nadie la lee desde el cliente: solo el servidor escribe y el panel
-- consulta por RPC con portón de admin.
ALTER TABLE public.oraculo_borrados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oraculo_borrados FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.oraculo_borrados TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.oraculo_borrados_id_seq TO service_role;

-- ── (2) La ficha del nodo suma lo vivo y lo borrado ────────────────────
-- Cambia el tipo de retorno, así que primero se retira la anterior.
DROP FUNCTION IF EXISTS public.get_tripulante_espejo_onb(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_tripulante_espejo_onb(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    reflejos_enviados       INT,
    reflejos_restantes      INT,
    reflejos_limite         INT,
    onb_max_step            INT,
    onb_completed           BOOLEAN,
    onb_answers             JSONB,
    onb_platform            TEXT,
    onb_started_at          TIMESTAMPTZ,
    /* 🜂 NUEVO: lo que hay AHORA y lo que hubo. */
    conversaciones_activas  INT,
    mensajes_activos        INT,
    borrados_veces          INT,
    borrados_conversaciones INT,
    borrados_ultimo_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lim      INT := 3;   -- FREE_ORACULO_LIMIT del edge oraculo-chat
    v_enviados INT := 0;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    /* Contador oficial; si no existe fila, se cuentan sus mensajes. */
    SELECT COALESCE(u.sent_count, 0) INTO v_enviados
    FROM oraculo_usage u
    WHERE u.clerk_user_id = target_clerk_id
    LIMIT 1;

    IF v_enviados IS NULL OR v_enviados = 0 THEN
        SELECT COUNT(*)::INT INTO v_enviados
        FROM oraculo_messages m
        WHERE m.clerk_user_id = target_clerk_id
          AND m.role = 'user';
    END IF;
    v_enviados := COALESCE(v_enviados, 0);

    RETURN QUERY
    SELECT
        v_enviados,
        GREATEST(0, v_lim - v_enviados),
        v_lim,
        o.max_step,
        o.completed,
        o.answers,
        o.platform,
        o.started_at,
        (SELECT COUNT(*)::INT FROM oraculo_conversations c
          WHERE c.clerk_user_id = target_clerk_id),
        (SELECT COUNT(*)::INT FROM oraculo_messages m2
          WHERE m2.clerk_user_id = target_clerk_id),
        (SELECT COUNT(*)::INT FROM oraculo_borrados b
          WHERE b.clerk_user_id = target_clerk_id),
        (SELECT COALESCE(SUM(b.conversaciones), 0)::INT FROM oraculo_borrados b
          WHERE b.clerk_user_id = target_clerk_id),
        (SELECT MAX(b.borrado_at) FROM oraculo_borrados b
          WHERE b.clerk_user_id = target_clerk_id)
    FROM (SELECT 1) AS _
    LEFT JOIN LATERAL (
        SELECT f.max_step, f.completed, f.answers, f.platform, f.started_at
        FROM onb_funnel f
        WHERE f.clerk_user_id = target_clerk_id
        ORDER BY f.updated_at DESC
        LIMIT 1
    ) o ON TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tripulante_espejo_onb(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_tripulante_espejo_onb(TEXT, TEXT)
    TO service_role;
