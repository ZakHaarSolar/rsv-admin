-- Red Solar Viva · MENSAJERÍA (reply + corazón + badge del ícono) + SENDERO
-- (rituales personalizados múltiples) — lote 2026-07-07
-- =====================================================================
-- 20260707_dm_reply_heart_badge_perso.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action v1.33 (+ dm_react_message) + Mensajes.tsx v1.23 +
-- RitualDiario.tsx v2.16 + PushSync v1.1 (escaner-app).
--
-- 4 bloques:
--  A) REPLY: dm_messages.reply_to (referencia a otro mensaje del MISMO hilo;
--     el cliente resuelve el texto citado de su propia lista descifrada, el
--     server solo guarda el id → nada nuevo que cifrar).
--  B) CORAZÓN: dm_messages.hearted (doble toque del receptor; reversible).
--     dm_react_message valida participante + que NO sea su propio mensaje.
--  C) BADGE del ícono: _push_dispatch gana p_badge → send-push ya lo mete en
--     aps.badge (v1.1) → iOS pinta el número en el ícono aunque la app esté
--     cerrada. El trigger de DM calcula los no-leídos REALES del destinatario.
--  D) SENDERO: hasta 10 rituales personalizados por Tripulante (slots 1-10;
--     el slot 1 es el 'personalizado' existente → compat total con la build
--     viva; los slots 2-10 son claves nuevas del catálogo).

-- ════════════════════════════════════════════════════════════════════
-- A + B · Columnas nuevas en dm_messages
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.dm_messages ADD COLUMN IF NOT EXISTS reply_to bigint;
ALTER TABLE public.dm_messages ADD COLUMN IF NOT EXISTS hearted boolean NOT NULL DEFAULT false;

-- ── dm_send_message + p_reply_to (DROP+CREATE: firma nueva; el cliente viejo
--    llama sin el param → DEFAULT NULL → compat con la build viva) ──────────
DROP FUNCTION IF EXISTS public.dm_send_message(text, bigint, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.dm_send_message(
    p_clerk_user_id text,
    p_conversation_id bigint,
    p_body text,
    p_kind text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_media_meta jsonb DEFAULT NULL,
    p_reply_to bigint DEFAULT NULL
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
    v_meta    jsonb := p_media_meta;
    v_reply   bigint := p_reply_to;
    v_prev0   text;        -- preview en claro
    v_key     text;
    v_stored  text;        -- body cifrado
    v_mstored text;        -- media_url cifrado
    v_prev    text;        -- preview cifrado
    v_enc     boolean := false;
    v_sid     bigint;      -- sticker resuelto
    v_surl    text;
    v_premium boolean;
    v_pack    bigint;
    mid       bigint;
    ts        timestamptz;
BEGIN
    -- Tipos conocidos: text / image / voice / sticker; cualquier otro → text.
    IF v_kind NOT IN ('text', 'image', 'voice', 'sticker') THEN v_kind := 'text'; END IF;

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

    -- REPLY: la referencia solo vale si apunta a un mensaje del MISMO hilo.
    IF v_reply IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM dm_messages
        WHERE id = v_reply AND conversation_id = p_conversation_id
    ) THEN
        v_reply := NULL;
    END IF;

    IF v_kind = 'sticker' THEN
        -- Resuelve el sticker del catálogo: la URL y el flag premium salen del
        -- server, no del cliente (no se puede forjar un sticker premium).
        v_sid := NULLIF(TRIM(COALESCE(p_media_meta->>'sticker_id', '')), '')::bigint;
        IF v_sid IS NULL THEN RETURN json_build_object('error', 'no_sticker'); END IF;
        SELECT s.image_url, sp.is_premium, s.pack_id
          INTO v_surl, v_premium, v_pack
          FROM stickers s JOIN sticker_packs sp ON sp.id = s.pack_id
          WHERE s.id = v_sid AND s.is_active AND sp.is_active;
        IF v_surl IS NULL THEN RETURN json_build_object('error', 'no_sticker'); END IF;
        IF v_premium AND NOT public._is_active_member(p_clerk_user_id) THEN
            RETURN json_build_object('error', 'locked');
        END IF;
        v_media := v_surl;
        v_meta  := jsonb_build_object('pack_id', v_pack, 'sticker_id', v_sid);
        v_prev0 := '✨ Sticker';
    ELSIF v_kind IN ('image', 'voice') THEN
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

    INSERT INTO dm_messages (conversation_id, sender_clerk_id, body, kind, media_url, media_meta, enc, reply_to)
    VALUES (p_conversation_id, p_clerk_user_id, v_stored, v_kind, v_mstored, v_meta, v_enc, v_reply)
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

-- ── dm_get_messages devuelve reply_to + hearted (misma firma) ──────────────
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
               public._dm_decrypt(m.transcript, m.enc) AS transcript,
               m.reply_to,
               m.hearted,
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

-- ── CORAZÓN: doble toque del receptor sobre un mensaje del otro ────────────
CREATE OR REPLACE FUNCTION public.dm_react_message(
    p_clerk_user_id text,
    p_message_id bigint,
    p_hearted boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    msg  dm_messages%ROWTYPE;
    conv dm_conversations%ROWTYPE;
BEGIN
    SELECT * INTO msg FROM dm_messages WHERE id = p_message_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    SELECT * INTO conv FROM dm_conversations WHERE id = msg.conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    -- El corazón se le da al mensaje DEL OTRO (no al propio).
    IF msg.sender_clerk_id = p_clerk_user_id THEN
        RETURN json_build_object('error', 'own_message');
    END IF;
    UPDATE dm_messages SET hearted = COALESCE(p_hearted, false)
    WHERE id = p_message_id;
    RETURN json_build_object('ok', true, 'hearted', COALESCE(p_hearted, false));
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- C · BADGE del ícono: _push_dispatch gana p_badge (send-push v1.1 ya lo
--     reenvía como aps.badge). DROP+CREATE por la firma; el cron del Radar
--     sigue llamando con 4 args (el 5º tiene DEFAULT).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public._push_dispatch(text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public._push_dispatch(
    p_clerk_user_id text,
    p_title text,
    p_body  text,
    p_data  jsonb DEFAULT '{}'::jsonb,
    p_badge int   DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
    v_url    text := 'https://cobtsltrcsruzcusyqhi.supabase.co/functions/v1/send-push';
    v_secret text;
BEGIN
    IF p_clerk_user_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM push_tokens WHERE clerk_user_id = p_clerk_user_id) THEN
        RETURN;
    END IF;

    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'push_dispatch_secret' LIMIT 1;
    IF v_secret IS NULL OR length(v_secret) = 0 THEN RETURN; END IF;

    PERFORM net.http_post(
        url     := v_url,
        body    := jsonb_build_object(
            'clerk_user_id', p_clerk_user_id,
            'title', p_title,
            'body',  p_body,
            'data',  COALESCE(p_data, '{}'::jsonb)
        ) || CASE WHEN p_badge IS NULL THEN '{}'::jsonb
                  ELSE jsonb_build_object('badge', p_badge) END,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-dispatch-secret', v_secret
        ),
        timeout_milliseconds := 5000
    );
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$;

-- ── El trigger de DM calcula los no-leídos REALES del destinatario (este
--    mensaje recién insertado ya cuenta) → el ícono marca (1), (2)… ─────────
CREATE OR REPLACE FUNCTION public._dm_notify_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recipient text;
    v_alias     text;
    v_badge     int;
BEGIN
    SELECT CASE WHEN c.user_a = NEW.sender_clerk_id THEN c.user_b ELSE c.user_a END
    INTO v_recipient
    FROM dm_conversations c
    WHERE c.id = NEW.conversation_id;

    IF v_recipient IS NULL OR v_recipient = NEW.sender_clerk_id THEN
        RETURN NEW;
    END IF;

    SELECT NULLIF(TRIM(alias), '') INTO v_alias
    FROM community_profiles WHERE clerk_user_id = NEW.sender_clerk_id;

    -- Total de no-leídos del destinatario (misma cuenta que dm_get_unread_count).
    SELECT COUNT(*)::int INTO v_badge
    FROM dm_messages m
    JOIN dm_conversations c ON c.id = m.conversation_id
    WHERE (c.user_a = v_recipient OR c.user_b = v_recipient)
      AND m.sender_clerk_id <> v_recipient
      AND m.created_at > (CASE WHEN c.user_a = v_recipient THEN c.a_last_read_at ELSE c.b_last_read_at END);

    PERFORM public._push_dispatch(
        v_recipient,
        COALESCE(v_alias, 'Un Tripulante'),
        'Te envió un mensaje',
        jsonb_build_object('type', 'dm', 'conversation_id', NEW.conversation_id),
        GREATEST(COALESCE(v_badge, 1), 1)
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- D · SENDERO: hasta 10 rituales personalizados (slots 1-10)
-- ════════════════════════════════════════════════════════════════════
-- Slots 2-10 en el catálogo (el 1 es 'personalizado', ya existe). Puntos
-- editables después desde Motor → Rituales, como todo el catálogo.
INSERT INTO public.daily_ritual_catalog (activity_key, label, points, requires_text, active, sort_order) VALUES
    ('personalizado_2',  'Personalizado 2',  10, false, true, 91),
    ('personalizado_3',  'Personalizado 3',  10, false, true, 92),
    ('personalizado_4',  'Personalizado 4',  10, false, true, 93),
    ('personalizado_5',  'Personalizado 5',  10, false, true, 94),
    ('personalizado_6',  'Personalizado 6',  10, false, true, 95),
    ('personalizado_7',  'Personalizado 7',  10, false, true, 96),
    ('personalizado_8',  'Personalizado 8',  10, false, true, 97),
    ('personalizado_9',  'Personalizado 9',  10, false, true, 98),
    ('personalizado_10', 'Personalizado 10', 10, false, true, 99)
ON CONFLICT (activity_key) DO NOTHING;

-- La rutina por-usuario pasa de 1 fila a N (slot 1-10). Las filas existentes
-- quedan como slot 1 → compat total con la build viva.
ALTER TABLE public.ritual_personalizado ADD COLUMN IF NOT EXISTS slot int NOT NULL DEFAULT 1;
DO $mig$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ritual_personalizado_pkey'
          AND conrelid = 'public.ritual_personalizado'::regclass
          AND (SELECT COUNT(*) FROM unnest(conkey)) = 1
    ) THEN
        ALTER TABLE public.ritual_personalizado DROP CONSTRAINT ritual_personalizado_pkey;
        ALTER TABLE public.ritual_personalizado ADD PRIMARY KEY (clerk_user_id, slot);
    END IF;
END $mig$;

-- Lectura: label (slot 1, compat con la build viva) + items (todos los slots).
CREATE OR REPLACE FUNCTION public.get_ritual_personalizado(
    p_clerk_user_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lbl   text := '';
    items json;
BEGIN
    IF p_clerk_user_id IS NULL OR length(p_clerk_user_id) < 3 THEN
        RETURN json_build_object('label', '', 'items', '[]'::json);
    END IF;
    SELECT label INTO lbl FROM ritual_personalizado
    WHERE clerk_user_id = p_clerk_user_id AND slot = 1;
    SELECT COALESCE(json_agg(json_build_object('slot', slot, 'label', label) ORDER BY slot), '[]'::json)
    INTO items
    FROM ritual_personalizado
    WHERE clerk_user_id = p_clerk_user_id AND length(TRIM(label)) > 0;
    RETURN json_build_object('label', COALESCE(lbl, ''), 'items', items);
END;
$$;

-- Guardar / limpiar UNA rutina por slot (DROP+CREATE: firma nueva con
-- p_slot DEFAULT 1 → el cliente viejo sigue escribiendo el slot 1).
DROP FUNCTION IF EXISTS public.set_ritual_personalizado(text, text);

CREATE OR REPLACE FUNCTION public.set_ritual_personalizado(
    p_clerk_user_id text,
    p_label         text,
    p_slot          int DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lbl  text := LEFT(TRIM(COALESCE(p_label, '')), 80);
    slt  int  := LEAST(GREATEST(COALESCE(p_slot, 1), 1), 10);
BEGIN
    IF p_clerk_user_id IS NULL OR length(p_clerk_user_id) < 3 THEN
        RAISE EXCEPTION 'clerk_user_id required';
    END IF;
    IF length(lbl) = 0 THEN
        -- Vacío = limpiar ese slot (deja de mostrarse).
        DELETE FROM ritual_personalizado
        WHERE clerk_user_id = p_clerk_user_id AND slot = slt;
        RETURN json_build_object('label', '', 'slot', slt);
    END IF;
    INSERT INTO ritual_personalizado (clerk_user_id, slot, label, updated_at)
    VALUES (p_clerk_user_id, slt, lbl, now())
    ON CONFLICT (clerk_user_id, slot)
    DO UPDATE SET label = EXCLUDED.label, updated_at = now();
    RETURN json_build_object('label', lbl, 'slot', slt);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- LOCKS (patrón canónico; re-afirmados tras cada CREATE)
-- ════════════════════════════════════════════════════════════════════
REVOKE ALL ON FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint)                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dm_react_message(text, bigint, boolean)                        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._push_dispatch(text, text, text, jsonb, int)                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ritual_personalizado(text)                                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_ritual_personalizado(text, text, int)                      FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint)                 TO service_role;
GRANT EXECUTE ON FUNCTION public.dm_react_message(text, bigint, boolean)                        TO service_role;
GRANT EXECUTE ON FUNCTION public._push_dispatch(text, text, text, jsonb, int)                   TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ritual_personalizado(text)                                 TO service_role;
GRANT EXECUTE ON FUNCTION public.set_ritual_personalizado(text, text, int)                      TO service_role;

NOTIFY pgrst, 'reload schema';
