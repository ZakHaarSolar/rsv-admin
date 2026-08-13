-- Red Solar Viva · MENSAJERÍA · Parte 2 — NOTAS DE VOZ en el chat
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Suma kind='voice' a dm_send_message (mismo andamiaje que la foto de la Parte
-- 1: el audio vive en R2 con ruta imposible de adivinar, su URL se guarda
-- CIFRADA en reposo con la misma llave; media_meta lleva la duración en seg).
-- Es CREATE OR REPLACE (la firma NO cambia respecto a 20260625c) → solo
-- actualiza el cuerpo. PRESERVA el cerrojo de moderación (_community_blocked).
--
-- dm_get_messages ya devuelve kind + media_url descifrado + media_meta (20260625c)
-- → no se toca.

CREATE OR REPLACE FUNCTION public.dm_send_message(
    p_clerk_user_id text,
    p_conversation_id bigint,
    p_body text,
    p_kind text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_media_meta jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv      dm_conversations%ROWTYPE;
    other     text;
    v_kind    text := LOWER(COALESCE(NULLIF(TRIM(p_kind), ''), 'text'));
    v_body    text := LEFT(TRIM(COALESCE(p_body, '')), 2000);
    v_media   text := NULLIF(TRIM(COALESCE(p_media_url, '')), '');
    v_prev0   text;        -- preview en claro
    v_key     text;
    v_stored  text;        -- body cifrado
    v_mstored text;        -- media_url cifrado
    v_prev    text;        -- preview cifrado
    v_enc     boolean := false;
    mid       bigint;
    ts        timestamptz;
BEGIN
    -- Tipos conocidos: text / image / voice; cualquier otro → text.
    IF v_kind NOT IN ('text', 'image', 'voice') THEN v_kind := 'text'; END IF;

    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;

    -- Moderación (preservado): no enviar si hay bloqueo en cualquier dirección.
    other := CASE WHEN conv.user_a = p_clerk_user_id THEN conv.user_b ELSE conv.user_a END;
    IF public._community_blocked(p_clerk_user_id, other) THEN
        RETURN json_build_object('error', 'blocked');
    END IF;

    IF v_kind IN ('image', 'voice') THEN
        IF v_media IS NULL THEN RETURN json_build_object('error', 'no_media'); END IF;
        v_prev0 := CASE WHEN v_kind = 'voice' THEN '🎤 Nota de voz' ELSE '📷 Foto' END;
    ELSE
        IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;
        v_prev0 := LEFT(v_body, 120);
    END IF;

    -- Cifrado en reposo (best-effort: si no hay llave, guarda en claro).
    v_key := public._dm_key();
    IF v_key IS NOT NULL THEN
        BEGIN
            v_stored  := armor(pgp_sym_encrypt(v_body, v_key));
            v_mstored := CASE WHEN v_media IS NULL THEN NULL
                              ELSE armor(pgp_sym_encrypt(v_media, v_key)) END;
            v_prev    := armor(pgp_sym_encrypt(v_prev0, v_key));
            v_enc     := true;
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_body; v_mstored := v_media; v_prev := v_prev0; v_enc := false;
        END;
    ELSE
        v_stored := v_body; v_mstored := v_media; v_prev := v_prev0;
    END IF;

    INSERT INTO dm_messages (conversation_id, sender_clerk_id, body, kind, media_url, media_meta, enc)
    VALUES (p_conversation_id, p_clerk_user_id, v_stored, v_kind, v_mstored, p_media_meta, v_enc)
    RETURNING id, created_at INTO mid, ts;

    UPDATE dm_conversations
    SET last_message_at = ts,
        last_message_preview = v_prev,
        preview_enc = v_enc,
        a_last_read_at = CASE WHEN p_clerk_user_id = user_a THEN ts ELSE a_last_read_at END,
        b_last_read_at = CASE WHEN p_clerk_user_id = user_b THEN ts ELSE b_last_read_at END
    WHERE id = p_conversation_id;

    RETURN json_build_object('ok', true, 'message_id', mid, 'created_at', ts);
END;
$$;
REVOKE ALL ON FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb)
    TO service_role;

NOTIFY pgrst, 'reload schema';
