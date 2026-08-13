-- Red Solar Viva · MENSAJERÍA · Cifrado EN REPOSO de los DMs (plus de privacidad)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Qué hace y qué NO (lo que pediste):
--   ✔ Los mensajes se guardan CIFRADOS en la base. Un volcado/robo de la tabla
--     `dm_messages` sale ilegible (texto cifrado), porque la llave NO vive en la
--     base: vive en Supabase Vault, cifrada con una llave de la plataforma que
--     un pg_dump NO incluye.
--   ✔ NOSOTROS (servidor/admin) seguimos pudiendo leer: las RPC descifran al
--     vuelo con la llave del Vault.
--   ✔ El Tripulante CONSERVA su historial al cambiar de celular (la llave es del
--     servidor, no del teléfono → no se pierde nada).
--   ✘ NO es extremo-a-extremo (no protege contra nosotros) — eso era el otro
--     camino, con el costo de perder historial; quedó descartado.
--
-- 100% defensivo: si el Vault no estuviera disponible, la llave sale NULL y todo
-- degrada a texto plano SIN romper el chat (encriptar/desencriptar son
-- best-effort). El cliente NO cambia (el cifrado es transparente en las RPC).

-- ── Extensiones ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ── Llave en el Vault (se crea una sola vez; aleatoria de 256 bits) ──
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'dm_msg_key') THEN
        PERFORM vault.create_secret(
            encode(gen_random_bytes(32), 'hex'),
            'dm_msg_key',
            'Llave de cifrado en reposo de los mensajes 1:1 (DMs)'
        );
    END IF;
END $$;

-- ── Columnas que marcan qué fila quedó cifrada ──────────────────────
ALTER TABLE public.dm_messages      ADD COLUMN IF NOT EXISTS enc         boolean NOT NULL DEFAULT false;
ALTER TABLE public.dm_conversations ADD COLUMN IF NOT EXISTS preview_enc boolean NOT NULL DEFAULT false;

-- ════════════════════════════════════════════════════════════════════
-- Helpers internos (NO accesibles por anon/authenticated; solo los usan las
-- RPC SECURITY DEFINER, que corren como el dueño). Defensivos: si el Vault
-- falla, la llave sale NULL y el texto pasa tal cual.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._dm_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    SELECT decrypted_secret INTO k FROM vault.decrypted_secrets WHERE name = 'dm_msg_key' LIMIT 1;
    RETURN k;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;  -- sin Vault → cifrado deshabilitado, el chat sigue
END $$;

CREATE OR REPLACE FUNCTION public._dm_decrypt(p_text text, p_enc boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    IF p_text IS NULL OR NOT COALESCE(p_enc, false) THEN
        RETURN p_text;
    END IF;
    k := public._dm_key();
    IF k IS NULL THEN RETURN p_text; END IF;
    RETURN pgp_sym_decrypt(dearmor(p_text), k);
EXCEPTION WHEN OTHERS THEN
    RETURN p_text;  -- nunca rompe el chat: peor caso, devuelve lo crudo
END $$;

REVOKE ALL ON FUNCTION public._dm_key()                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._dm_decrypt(text, boolean) FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- dm_send_message — cifra el cuerpo + el preview antes de guardar (best-effort).
-- ════════════════════════════════════════════════════════════════════
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
    conv     dm_conversations%ROWTYPE;
    v_body   text := LEFT(TRIM(COALESCE(p_body, '')), 2000);
    v_key    text;
    v_stored text;
    v_prev   text;
    v_enc    boolean := false;
    mid      bigint;
    ts       timestamptz;
BEGIN
    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;

    -- Cifrado en reposo (best-effort: si no hay llave, guarda en claro).
    v_key := public._dm_key();
    IF v_key IS NOT NULL THEN
        BEGIN
            v_stored := armor(pgp_sym_encrypt(v_body, v_key));
            v_prev   := armor(pgp_sym_encrypt(LEFT(v_body, 120), v_key));
            v_enc    := true;
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_body; v_prev := LEFT(v_body, 120); v_enc := false;
        END;
    ELSE
        v_stored := v_body; v_prev := LEFT(v_body, 120);
    END IF;

    INSERT INTO dm_messages (conversation_id, sender_clerk_id, body, enc)
    VALUES (p_conversation_id, p_clerk_user_id, v_stored, v_enc)
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

-- ════════════════════════════════════════════════════════════════════
-- dm_get_messages — descifra el cuerpo al vuelo.
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

-- ════════════════════════════════════════════════════════════════════
-- dm_get_my_conversations — descifra el preview de la bandeja.
-- ════════════════════════════════════════════════════════════════════
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
            c.preview_enc,
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
        'last_message_preview', public._dm_decrypt(mn.last_message_preview, mn.preview_enc),
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

-- ── Cifra lo que ya existía en claro (pocos mensajes de prueba) ─────
DO $$
DECLARE k text;
BEGIN
    k := public._dm_key();
    IF k IS NOT NULL THEN
        UPDATE dm_messages
        SET body = armor(pgp_sym_encrypt(body, k)), enc = true
        WHERE NOT COALESCE(enc, false) AND body IS NOT NULL;

        UPDATE dm_conversations
        SET last_message_preview = armor(pgp_sym_encrypt(last_message_preview, k)), preview_enc = true
        WHERE NOT COALESCE(preview_enc, false) AND last_message_preview IS NOT NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;  -- si algo falla, los nuevos igual se cifran; los viejos quedan en claro
END $$;

NOTIFY pgrst, 'reload schema';
