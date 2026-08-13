-- Red Solar Viva · CAPA DE COMUNIDAD · Fase 2 — Mensajería entre Tripulantes (DM)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Mensajes 1:1 entre Tripulantes ("Sintonizar"). Solo puedes INICIAR una
-- conversación con alguien VISIBLE en la Constelación (opt-in del directorio) y
-- que no sea cuenta interna; una vez abierta, ambos pueden responder. Los
-- cuerpos de los mensajes son privados (solo los 2 participantes los leen vía
-- RPCs que validan membresía). CERO PII: nunca se expone el email.
--
-- Seguridad: tablas RLS sin policies → solo vía RPCs SECURITY DEFINER, ruteadas
-- por el gateway user-action (inyecta el clerk_user_id verificado). REVOKE anon.

-- ════════════════════════════════════════════════════════════════════
-- TABLAS
-- ════════════════════════════════════════════════════════════════════

-- Conversación 1:1 canónica: user_a < user_b (orden lexicográfico) → una sola
-- fila por par, sin duplicados. last_read por participante para el "no leído".
CREATE TABLE IF NOT EXISTS public.dm_conversations (
    id                   bigserial PRIMARY KEY,
    user_a               text NOT NULL,
    user_b               text NOT NULL,
    a_last_read_at       timestamptz NOT NULL DEFAULT 'epoch',
    b_last_read_at       timestamptz NOT NULL DEFAULT 'epoch',
    last_message_at      timestamptz,
    last_message_preview text NOT NULL DEFAULT '',
    created_at           timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_a, user_b)
);
CREATE INDEX IF NOT EXISTS idx_dm_conv_a ON public.dm_conversations (user_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conv_b ON public.dm_conversations (user_b, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.dm_messages (
    id              bigserial PRIMARY KEY,
    conversation_id bigint NOT NULL REFERENCES public.dm_conversations (id) ON DELETE CASCADE,
    sender_clerk_id text NOT NULL,
    body            text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conv ON public.dm_messages (conversation_id, id);

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages      ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- RPCs DEL TRIPULANTE  (ruteadas por user-action; inyecta p_clerk_user_id)
-- ════════════════════════════════════════════════════════════════════

-- Abre (o recupera) la conversación con un Tripulante. El target debe ser un
-- perfil VISIBLE de la Constelación + no interno. Idempotente por par.
CREATE OR REPLACE FUNCTION public.dm_start_conversation(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me  text := p_clerk_user_id;
    tgt text := COALESCE(p_target_clerk_id, '');
    a   text; b text; cid bigint;
BEGIN
    IF tgt = '' OR tgt = me THEN
        RETURN json_build_object('error', 'bad_target');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM community_profiles cp
        LEFT JOIN profiles p ON p.clerk_user_id = cp.clerk_user_id
        WHERE cp.clerk_user_id = tgt
          AND cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
          AND (
            p.email IS NULL
            OR lower(p.email) NOT IN (
                'andrea.dl13@gmail.com',
                'beachandsunrisecancun@gmail.com',
                'cuerpodeluz555@gmail.com',
                'diegosotoborjaalmeida@gmail.com',
                'redsolarviva@gmail.com',
                'veocancun@gmail.com',
                'veotuluzinterna@gmail.com'
            )
          )
    ) THEN
        RETURN json_build_object('error', 'target_unavailable');
    END IF;

    IF me < tgt THEN a := me; b := tgt; ELSE a := tgt; b := me; END IF;

    INSERT INTO dm_conversations (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a  -- no-op para que RETURNING devuelva la fila existente
    RETURNING id INTO cid;

    RETURN json_build_object('ok', true, 'conversation_id', cid);
END;
$$;

-- Envía un mensaje. Valida que el caller sea participante. Cuerpo 1..2000.
-- Actualiza el preview + marca leído para el remitente (su propio msg no es no-leído).
CREATE OR REPLACE FUNCTION public.dm_send_message(
    p_clerk_user_id text,
    p_conversation_id bigint,
    p_body text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv   dm_conversations%ROWTYPE;
    v_body text := LEFT(TRIM(COALESCE(p_body, '')), 2000);
    mid    bigint;
    ts     timestamptz;
BEGIN
    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;

    INSERT INTO dm_messages (conversation_id, sender_clerk_id, body)
    VALUES (p_conversation_id, p_clerk_user_id, v_body)
    RETURNING id, created_at INTO mid, ts;

    UPDATE dm_conversations
    SET last_message_at = ts,
        last_message_preview = LEFT(v_body, 120),
        a_last_read_at = CASE WHEN p_clerk_user_id = user_a THEN ts ELSE a_last_read_at END,
        b_last_read_at = CASE WHEN p_clerk_user_id = user_b THEN ts ELSE b_last_read_at END
    WHERE id = p_conversation_id;

    RETURN json_build_object('ok', true, 'message_id', mid, 'created_at', ts);
END;
$$;

-- Mis conversaciones (con ≥1 mensaje), con el OTRO participante (alias + avatar),
-- preview, fecha y conteo de no-leídos. Orden por actividad reciente.
CREATE OR REPLACE FUNCTION public.dm_get_my_conversations(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me text := p_clerk_user_id;
    result json;
BEGIN
    WITH mine AS (
        SELECT
            c.id,
            c.last_message_preview,
            c.last_message_at,
            CASE WHEN c.user_a = me THEN c.user_b ELSE c.user_a END AS other_id,
            CASE WHEN c.user_a = me THEN c.a_last_read_at ELSE c.b_last_read_at END AS my_last_read
        FROM dm_conversations c
        WHERE (c.user_a = me OR c.user_b = me)
          AND c.last_message_at IS NOT NULL
    )
    SELECT COALESCE(json_agg(json_build_object(
        'conversation_id', mn.id,
        'other_id', mn.other_id,
        'other_alias', COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = mn.other_id), ''),
        'other_avatar', COALESCE((SELECT selected_avatar FROM user_crystal_state WHERE clerk_user_id = mn.other_id), 'nova'),
        'last_message_preview', mn.last_message_preview,
        'last_message_at', mn.last_message_at,
        'unread', (
            SELECT COUNT(*) FROM dm_messages m
            WHERE m.conversation_id = mn.id
              AND m.sender_clerk_id <> me
              AND m.created_at > mn.my_last_read
        )::int
    ) ORDER BY mn.last_message_at DESC NULLS LAST), '[]'::json)
    INTO result FROM mine mn;

    RETURN result;
END;
$$;

-- Mensajes de una conversación (valida participante). Devuelve los últimos
-- p_limit (o anteriores a p_before_id para paginar) en orden cronológico ASC.
CREATE OR REPLACE FUNCTION public.dm_get_messages(
    p_clerk_user_id text,
    p_conversation_id bigint,
    p_limit integer DEFAULT 40,
    p_before_id bigint DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me   text := p_clerk_user_id;
    conv dm_conversations%ROWTYPE;
    lim  int := LEAST(GREATEST(COALESCE(p_limit, 40), 1), 60);
    msgs json;
BEGIN
    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF me <> conv.user_a AND me <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;

    SELECT COALESCE(json_agg(row_to_json(m2) ORDER BY m2.id ASC), '[]'::json)
    INTO msgs
    FROM (
        SELECT m.id, m.sender_clerk_id, m.body, m.created_at, (m.sender_clerk_id = me) AS mine
        FROM dm_messages m
        WHERE m.conversation_id = p_conversation_id
          AND (p_before_id IS NULL OR m.id < p_before_id)
        ORDER BY m.id DESC
        LIMIT lim
    ) m2;

    RETURN json_build_object(
        'ok', true,
        'messages', msgs,
        'other_id', CASE WHEN conv.user_a = me THEN conv.user_b ELSE conv.user_a END
    );
END;
$$;

-- Marca la conversación como leída para el caller (actualiza su last_read_at).
CREATE OR REPLACE FUNCTION public.dm_mark_read(
    p_clerk_user_id text,
    p_conversation_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me   text := p_clerk_user_id;
    conv dm_conversations%ROWTYPE;
BEGIN
    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF me <> conv.user_a AND me <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;

    UPDATE dm_conversations
    SET a_last_read_at = CASE WHEN me = user_a THEN now() ELSE a_last_read_at END,
        b_last_read_at = CASE WHEN me = user_b THEN now() ELSE b_last_read_at END
    WHERE id = p_conversation_id;

    RETURN json_build_object('ok', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS — solo service_role (las llama user-action tras verificar el token).
-- ════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.dm_start_conversation(text, text)                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dm_send_message(text, bigint, text)                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dm_get_my_conversations(text)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dm_mark_read(text, bigint)                              FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.dm_start_conversation(text, text)                       TO service_role;
GRANT  EXECUTE ON FUNCTION public.dm_send_message(text, bigint, text)                     TO service_role;
GRANT  EXECUTE ON FUNCTION public.dm_get_my_conversations(text)                           TO service_role;
GRANT  EXECUTE ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint)         TO service_role;
GRANT  EXECUTE ON FUNCTION public.dm_mark_read(text, bigint)                              TO service_role;
