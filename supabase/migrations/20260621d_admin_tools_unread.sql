-- Red Solar Viva · Herramientas admin (reset de avatar + enviar DM) + contador
-- de mensajes no leídos para el badge de Mi Núcleo
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- (1) admin_reset_avatar(email): borra el avatar elegido + lo comprado de un
--     Tripulante → al re-entrar a la app vuelve a elegir avatar desde cero.
-- (2) admin_send_dm(email, body): el admin manda un DM a cualquier Tripulante
--     (útil para probar con un solo dispositivo: veocancun → cuerpodeluz555).
--     Dispara el trigger de push igual que un mensaje normal.
-- (3) dm_get_unread_count(): total de no-leídos del Tripulante → badge.

-- ════════════════════════════════════════════════════════════════════
-- (1) RESET DE AVATAR  (admin-action; inyecta p_admin_clerk_id)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_reset_avatar(
    p_admin_clerk_id text,
    p_target_email   text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    em text := lower(trim(COALESCE(p_target_email, '')));
    n_users int := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF length(em) = 0 THEN RETURN json_build_object('error', 'no_email'); END IF;

    WITH targets AS (
        SELECT clerk_user_id FROM profiles WHERE lower(email) = em
    ), del_owned AS (
        DELETE FROM user_crystal_owned
        WHERE clerk_user_id IN (SELECT clerk_user_id FROM targets)
        RETURNING 1
    ), del_state AS (
        DELETE FROM user_crystal_state
        WHERE clerk_user_id IN (SELECT clerk_user_id FROM targets)
        RETURNING 1
    )
    SELECT COUNT(*) INTO n_users FROM targets;

    IF n_users = 0 THEN RETURN json_build_object('error', 'user_not_found'); END IF;
    RETURN json_build_object('ok', true, 'users_reset', n_users);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- (2) ENVIAR DM COMO ADMIN  (admin-action; inyecta p_admin_clerk_id)
--     Crea/recupera la conversación admin↔target e inserta el mensaje (cifrado
--     igual que dm_send_message). El trigger de push notifica al destinatario.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_send_dm(
    p_admin_clerk_id text,
    p_target_email   text,
    p_body           text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    em      text := lower(trim(COALESCE(p_target_email, '')));
    v_body  text := LEFT(TRIM(COALESCE(p_body, '')), 2000);
    tgt     text;
    me      text := p_admin_clerk_id;
    a text; b text; cid bigint;
    v_key text; v_stored text; v_prev text; v_enc boolean := false;
    mid bigint; ts timestamptz;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = me AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF length(em) = 0 THEN RETURN json_build_object('error', 'no_email'); END IF;
    IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;

    SELECT clerk_user_id INTO tgt FROM profiles WHERE lower(email) = em LIMIT 1;
    IF tgt IS NULL THEN RETURN json_build_object('error', 'user_not_found'); END IF;
    IF tgt = me THEN RETURN json_build_object('error', 'cant_message_self'); END IF;

    IF me < tgt THEN a := me; b := tgt; ELSE a := tgt; b := me; END IF;
    INSERT INTO dm_conversations (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
    RETURNING id INTO cid;

    -- Cifrado en reposo (best-effort), idéntico a dm_send_message.
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
    VALUES (cid, me, v_stored, v_enc)
    RETURNING id, created_at INTO mid, ts;

    UPDATE dm_conversations
    SET last_message_at = ts,
        last_message_preview = v_prev,
        preview_enc = v_enc,
        a_last_read_at = CASE WHEN me = user_a THEN ts ELSE a_last_read_at END,
        b_last_read_at = CASE WHEN me = user_b THEN ts ELSE b_last_read_at END
    WHERE id = cid;

    RETURN json_build_object('ok', true, 'conversation_id', cid, 'target', tgt);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- (3) NO-LEÍDOS  (user-action; inyecta p_clerk_user_id)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.dm_get_unread_count(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me text := p_clerk_user_id;
    v_count int;
BEGIN
    SELECT COUNT(*)::int INTO v_count
    FROM dm_messages m
    JOIN dm_conversations c ON c.id = m.conversation_id
    WHERE (c.user_a = me OR c.user_b = me)
      AND m.sender_clerk_id <> me
      AND m.created_at > (CASE WHEN c.user_a = me THEN c.a_last_read_at ELSE c.b_last_read_at END);
    RETURN json_build_object('count', COALESCE(v_count, 0));
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS
-- ════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.admin_reset_avatar(text, text)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_send_dm(text, text, text)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dm_get_unread_count(text)             FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_reset_avatar(text, text)        TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_send_dm(text, text, text)       TO service_role;
GRANT  EXECUTE ON FUNCTION public.dm_get_unread_count(text)             TO service_role;

NOTIFY pgrst, 'reload schema';
