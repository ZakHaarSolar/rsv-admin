-- Red Solar Viva · admin_send_dm muestra "Zak'Haar" como remitente del push
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere 20260621d_admin_tools_unread.sql ya aplicado.
--
-- El trigger de push (_dm_notify_recipient) toma el nombre del remitente de
-- community_profiles.alias. La cuenta admin no tenía perfil de comunidad → el
-- push decía "Un Tripulante". Ahora admin_send_dm fija el alias del admin a
-- "Zak'Haar" (sin hacerlo visible en el directorio) → el push dice "Zak'Haar".

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

    -- Nombre de marca del remitente para el push (no aparece en el directorio:
    -- visible se deja en false). Idempotente.
    INSERT INTO community_profiles (clerk_user_id, alias, visible, updated_at)
    VALUES (me, 'Zak''Haar', false, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET alias = 'Zak''Haar', updated_at = now();

    IF me < tgt THEN a := me; b := tgt; ELSE a := tgt; b := me; END IF;
    INSERT INTO dm_conversations (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
    RETURNING id INTO cid;

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

REVOKE EXECUTE ON FUNCTION public.admin_send_dm(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_send_dm(text, text, text) TO service_role;
