-- Red Solar Viva · MENSAJERÍA — TRANSCRIPCIÓN de notas de voz (para Sintonía)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere 20260625d_dm_voice.sql (notas de voz) + 20260625e_dm_stickers.sql
-- (define _is_active_member) + 20260620q (cifrado en reposo).
--
-- Un miembro (Sintonía/Inmersión) puede transcribir una nota de voz de su
-- conversación. El texto se guarda CIFRADO en el mensaje (misma llave que el
-- resto) → se cachea: una vez transcrita, ambos la ven sin volver a gastar.
-- Tope mensual por usuario (150) para cuidar el costo de Gemini.
--
-- La orquestación vive en el edge `transcribe-voice` (verifica token + fetch del
-- audio + Gemini). Estas RPC son el gate (participante + miembro + cap) y el
-- guardado; las llama el edge con service_role. NO van por el gateway de usuario.

-- ── Columna del transcript (cifrada como body/media) ────────────────
ALTER TABLE public.dm_messages
    ADD COLUMN IF NOT EXISTS transcript text;

-- ── Cap mensual de transcripciones por usuario ─────────────────────
CREATE TABLE IF NOT EXISTS public.voice_transcript_usage (
    clerk_user_id text NOT NULL,
    ym            text NOT NULL,           -- 'YYYY-MM' (America/Cancun)
    count         integer NOT NULL DEFAULT 0,
    PRIMARY KEY (clerk_user_id, ym)
);
ALTER TABLE public.voice_transcript_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.voice_transcript_usage FROM anon, authenticated;

-- ── Gate + datos para transcribir (participante + miembro + cap) ────
-- Devuelve el media_url DESCIFRADO (para que el edge baje el audio), el
-- transcript existente (si ya se transcribió → el edge lo devuelve sin gastar)
-- y cuántas transcripciones le quedan al usuario este mes.
CREATE OR REPLACE FUNCTION public.transcribe_voice_check(
    p_clerk_user_id text,
    p_message_id    bigint
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    m     dm_messages%ROWTYPE;
    conv  dm_conversations%ROWTYPE;
    v_used int := 0;
    v_cap  int := 150;
    v_ym   text := to_char(now() AT TIME ZONE 'America/Cancun', 'YYYY-MM');
BEGIN
    SELECT * INTO m FROM dm_messages WHERE id = p_message_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_message'); END IF;
    IF COALESCE(m.kind, 'text') <> 'voice' THEN
        RETURN json_build_object('error', 'not_voice');
    END IF;
    SELECT * INTO conv FROM dm_conversations WHERE id = m.conversation_id;
    IF NOT FOUND
       OR (p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b) THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF NOT public._is_active_member(p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    SELECT COALESCE(count, 0) INTO v_used
        FROM voice_transcript_usage
        WHERE clerk_user_id = p_clerk_user_id AND ym = v_ym;
    RETURN json_build_object(
        'ok', true,
        'media_url', public._dm_decrypt(m.media_url, m.enc),
        'transcript', public._dm_decrypt(m.transcript, m.enc),
        'cap_left', GREATEST(0, v_cap - COALESCE(v_used, 0))
    );
END $$;

-- ── Guarda el transcript (cifrado) + suma 1 al cap del mes ─────────
CREATE OR REPLACE FUNCTION public.set_voice_transcript(
    p_clerk_user_id text,
    p_message_id    bigint,
    p_text          text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    m       dm_messages%ROWTYPE;
    conv    dm_conversations%ROWTYPE;
    v_key   text;
    v_stored text;
    v_enc   boolean;
    v_txt   text := LEFT(TRIM(COALESCE(p_text, '')), 4000);
    v_ym    text := to_char(now() AT TIME ZONE 'America/Cancun', 'YYYY-MM');
BEGIN
    IF length(v_txt) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;
    SELECT * INTO m FROM dm_messages WHERE id = p_message_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_message'); END IF;
    SELECT * INTO conv FROM dm_conversations WHERE id = m.conversation_id;
    IF NOT FOUND
       OR (p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b) THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF NOT public._is_active_member(p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;

    -- Cifra con la misma llave/estado que el mensaje (se descifra con m.enc).
    v_enc := COALESCE(m.enc, false);
    v_key := public._dm_key();
    IF v_enc AND v_key IS NOT NULL THEN
        BEGIN
            v_stored := armor(pgp_sym_encrypt(v_txt, v_key));
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_txt;
        END;
    ELSE
        v_stored := v_txt;
    END IF;

    UPDATE dm_messages SET transcript = v_stored WHERE id = p_message_id;

    INSERT INTO voice_transcript_usage (clerk_user_id, ym, count)
    VALUES (p_clerk_user_id, v_ym, 1)
    ON CONFLICT (clerk_user_id, ym)
        DO UPDATE SET count = voice_transcript_usage.count + 1;

    RETURN json_build_object('ok', true, 'transcript', v_txt);
END $$;

-- ── dm_get_messages — ahora devuelve el transcript (descifrado) ─────
-- CREATE OR REPLACE (misma firma) → solo suma el campo `transcript`.
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

-- ── REVOKE anon + GRANT service_role (las llama el edge) ───────────
REVOKE ALL ON FUNCTION public.transcribe_voice_check(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_voice_transcript(text, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.transcribe_voice_check(text, bigint) TO service_role;
GRANT  EXECUTE ON FUNCTION public.set_voice_transcript(text, bigint, text) TO service_role;
GRANT  EXECUTE ON FUNCTION public.dm_get_messages(text, bigint, integer, bigint) TO service_role;

NOTIFY pgrst, 'reload schema';
