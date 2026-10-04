-- Red Solar Viva · ELIMINAR PARA MÍ en el chat de la Comunidad (Zak 2026-10-04)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente: se puede correr más de una vez sin duplicar nada.
--
-- En la computadora, clic derecho sobre un mensaje → Responder · Copiar ·
-- Eliminar. "Eliminar" esconde el mensaje SOLO para quien lo elimina, en
-- todos sus aparatos; para los demás sigue ahí (como "Eliminar para mí" de
-- WhatsApp). Sirve igual para conversaciones (dm) y grupos (grp).
--
-- No toca dm_get_messages ni grp_get_messages: la app pide la lista de lo
-- que escondiste (chat_get_ocultos) y lo filtra al pintar. Las dos funciones
-- se rutean por el portón user-action (v1.50), que inyecta el clerk id
-- verificado en p_clerk_user_id.

CREATE TABLE IF NOT EXISTS public.chat_mensajes_ocultos (
    clerk_user_id text        NOT NULL,
    tipo          text        NOT NULL,
    message_id    bigint      NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, tipo, message_id),
    CONSTRAINT chat_mensajes_ocultos_tipo_chk CHECK (tipo IN ('dm', 'grp'))
);

ALTER TABLE public.chat_mensajes_ocultos ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo las funciones SECURITY DEFINER de abajo la tocan.
REVOKE ALL ON TABLE public.chat_mensajes_ocultos FROM PUBLIC, anon, authenticated;

-- ── Esconder un mensaje para mí ──────────────────────────────────────
-- Valida que quien lo pide participe de esa conversación o sea miembro de
-- ese grupo. Esconder dos veces el mismo mensaje no hace nada.
CREATE OR REPLACE FUNCTION public.chat_ocultar_mensaje(
    p_clerk_user_id text,
    p_tipo text,
    p_message_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conv bigint;
    v_grp  bigint;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('error', 'no_user');
    END IF;

    IF p_tipo = 'dm' THEN
        SELECT conversation_id INTO v_conv FROM dm_messages WHERE id = p_message_id;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
        IF NOT EXISTS (
            SELECT 1 FROM dm_conversations c
            WHERE c.id = v_conv
              AND (c.user_a = p_clerk_user_id OR c.user_b = p_clerk_user_id)
        ) THEN
            RETURN json_build_object('error', 'not_participant');
        END IF;
    ELSIF p_tipo = 'grp' THEN
        SELECT group_id INTO v_grp FROM grp_messages WHERE id = p_message_id;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
        IF NOT EXISTS (
            SELECT 1 FROM grp_members gm
            WHERE gm.group_id = v_grp AND gm.clerk_user_id = p_clerk_user_id
        ) THEN
            RETURN json_build_object('error', 'not_member');
        END IF;
    ELSE
        RETURN json_build_object('error', 'bad_kind');
    END IF;

    INSERT INTO chat_mensajes_ocultos (clerk_user_id, tipo, message_id)
    VALUES (p_clerk_user_id, p_tipo, p_message_id)
    ON CONFLICT DO NOTHING;

    RETURN json_build_object('ok', true);
END;
$$;

-- ── Lo que escondí (para filtrarlo al pintar el chat) ────────────────
CREATE OR REPLACE FUNCTION public.chat_get_ocultos(
    p_clerk_user_id text
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'ok', true,
        'dm', COALESCE(
            (SELECT json_agg(message_id ORDER BY message_id)
             FROM chat_mensajes_ocultos
             WHERE clerk_user_id = p_clerk_user_id AND tipo = 'dm'),
            '[]'::json),
        'grp', COALESCE(
            (SELECT json_agg(message_id ORDER BY message_id)
             FROM chat_mensajes_ocultos
             WHERE clerk_user_id = p_clerk_user_id AND tipo = 'grp'),
            '[]'::json)
    );
$$;

REVOKE ALL ON FUNCTION public.chat_ocultar_mensaje(text, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_get_ocultos(text)                   FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_ocultar_mensaje(text, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.chat_get_ocultos(text)                   TO service_role;

NOTIFY pgrst, 'reload schema';
