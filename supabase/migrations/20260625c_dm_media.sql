-- Red Solar Viva · MENSAJERÍA · Parte 1 — FOTOS en el chat (cámara + galería)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Suma mensajes con MEDIA al chat 1:1. Empezamos por fotos (kind='image'); el
-- mismo andamiaje sirve para notas de voz (kind='voice') y stickers más
-- adelante. La imagen vive en R2 (subida por la edge upload-dm-media, ruta
-- imposible de adivinar); aquí guardamos su URL **cifrada en reposo** con la
-- misma llave del Vault que el texto → un volcado de la base no alcanza la foto.
--
--   • kind         → 'text' | 'image' | (futuro: 'voice' | 'sticker')
--   • media_url    → URL de R2 (cifrada, igual que body; comparte el flag `enc`)
--   • media_meta   → jsonb liviano no sensible (ancho/alto, etc.)
--
-- 100% retrocompatible: kind default 'text'; un cliente viejo que no manda
-- p_kind/p_media_* sigue funcionando igual.

-- ── Columnas nuevas ─────────────────────────────────────────────────
ALTER TABLE public.dm_messages
    ADD COLUMN IF NOT EXISTS kind       text  NOT NULL DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS media_url  text,
    ADD COLUMN IF NOT EXISTS media_meta jsonb;

-- ════════════════════════════════════════════════════════════════════
-- dm_send_message — ahora acepta kind + media (foto). Cifra body Y media_url
-- con la misma llave (un solo flag `enc`). Para una foto, body puede ir vacío
-- (sin caption); el preview de la bandeja dice "📷 Foto".
-- DROP+CREATE porque cambia la firma (PostgREST resuelve por el set de params).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.dm_send_message(text, bigint, text);
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
    -- Solo conocemos 'text' e 'image' por ahora; cualquier otra cosa → text.
    IF v_kind NOT IN ('text', 'image') THEN v_kind := 'text'; END IF;

    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;

    -- Moderación (preservado de 20260621f): no enviar si hay bloqueo en
    -- cualquier dirección. SIN esto, un DROP+CREATE quitaría el cerrojo.
    other := CASE WHEN conv.user_a = p_clerk_user_id THEN conv.user_b ELSE conv.user_a END;
    IF public._community_blocked(p_clerk_user_id, other) THEN
        RETURN json_build_object('error', 'blocked');
    END IF;

    IF v_kind = 'image' THEN
        IF v_media IS NULL THEN RETURN json_build_object('error', 'no_media'); END IF;
        v_prev0 := '📷 Foto';
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

-- ════════════════════════════════════════════════════════════════════
-- dm_get_messages — devuelve kind + media_url (descifrado) + media_meta.
-- Misma firma → CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════
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
        SELECT m.id,
               m.sender_clerk_id,
               public._dm_decrypt(m.body, m.enc) AS body,
               COALESCE(m.kind, 'text') AS kind,
               public._dm_decrypt(m.media_url, m.enc) AS media_url,
               m.media_meta,
               m.created_at,
               (m.sender_clerk_id = me) AS mine
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
REVOKE ALL ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint)
    TO service_role;

NOTIFY pgrst, 'reload schema';

-- Verificar (opcional): mandar una foto desde la app → debería verse la burbuja
-- de imagen y, en la bandeja, el preview "📷 Foto".
