-- Red Solar Viva · GRUPOS + NOTAS COMPARTIDAS + VISTA PREVIA EN LOS AVISOS
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente: se puede correr dos veces sin duplicar nada.
--
-- QUÉ TRAE (sala 2026-09-21, pedido de Zak):
--
--   1. CIFRADO QUE SÍ CIFRA. Los mensajes privados y las respuestas de
--      Realidad Elegida se guardaban EN CLARO: sus funciones tenían
--      search_path = public y pgcrypto vive en el esquema `extensions`, así
--      que armor()/pgp_sym_encrypt() no existían para ellas, el bloque
--      EXCEPTION lo atrapaba en silencio y guardaba el texto plano (medido:
--      58 de 59 mensajes y 33 de 33 respuestas con enc=false). Se corrige el
--      search_path y se cifra lo que ya estaba guardado.
--
--   2. VISTA PREVIA EN LOS AVISOS (como WhatsApp). El aviso de un mensaje
--      dice QUIÉN y QUÉ: el texto (recortado), o "Foto", "Nota de voz",
--      "Sticker". En el idioma del aparato. iOS agrupa los avisos por
--      conversación (thread_id).
--
--   3. GRUPOS (hasta 10 tripulantes). Crear, invitar (la persona ACEPTA antes
--      de entrar: consentimiento primero, como todo en la Comunidad), texto,
--      fotos, notas de voz, stickers, responder, corazones de varios, leídos,
--      silenciar, administradores, quitar, salir, cambiar nombre/foto,
--      eliminar el grupo. Quien entra ve desde que entró (no el historial
--      anterior). Cifrado en reposo con la misma llave de los mensajes.
--
--   4. NOTAS COMPARTIDAS (Bitácora). Quien creó la nota invita (hasta 10
--      personas en total); la persona recibe aviso, ve QUIÉN la invita y
--      acepta o rechaza; al aceptar, los dos la ven y la editan. Cada quien
--      conserva SU carpeta, anclado y favorito. Control de versiones para que
--      dos personas escribiendo a la vez no se pisen (la app funde los
--      cambios en vez de perder uno).
--
--   5. Cómo se invita: por CONTACTOS (con quien ya hablas, compartes grupo o
--      nota), por NOMBRE en la Comunidad (solo perfiles visibles) o por
--      CORREO exacto (cualquier cuenta). Nunca se enumera a nadie: el correo
--      tiene que ser exacto.
--
-- Compatibilidad: la app publicada (1.1.4) sigue funcionando igual. Las
-- funciones que cambian de firma (get_my_notas, upsert_nota) se recrean con
-- parámetros NUEVOS opcionales; sin ellos devuelven exactamente lo de antes.
--
-- Requiere después: redeploy de user-action (v1.49), send-push (v1.3) y
-- transcribe-voice (v1.1). Los despliega Claude.

-- =====================================================================
-- 0) CIFRADO QUE SÍ CIFRA (mensajes privados + Realidad Elegida)
-- =====================================================================
ALTER FUNCTION public._dm_decrypt(text, boolean) SET search_path = public, extensions;
ALTER FUNCTION public.dm_send_message(text, bigint, text, text, text, jsonb, bigint) SET search_path = public, extensions;
ALTER FUNCTION public.admin_send_dm(text, text, text) SET search_path = public, extensions;
ALTER FUNCTION public.set_voice_transcript(text, bigint, text) SET search_path = public, extensions;
ALTER FUNCTION public._vision_encrypt(text) SET search_path = public, extensions;
ALTER FUNCTION public._vision_decrypt(text, boolean) SET search_path = public, extensions;

-- Lo que ya estaba guardado en claro se cifra ahora. El guardia de medios se
-- apaga SOLO durante este UPDATE (si no, re-validaría direcciones viejas y
-- podría borrar la foto de un mensaje antiguo).
DO $$
DECLARE
    k text := public._dm_key();
BEGIN
    IF k IS NULL THEN
        RAISE NOTICE 'sin llave dm_msg_key: no se cifra lo existente';
        RETURN;
    END IF;
    EXECUTE 'ALTER TABLE public.dm_messages DISABLE TRIGGER dm_messages_media_guard';
    UPDATE public.dm_messages SET
        body       = CASE WHEN body IS NULL OR body = '' THEN body
                          ELSE extensions.armor(extensions.pgp_sym_encrypt(body, k)) END,
        media_url  = CASE WHEN media_url IS NULL OR media_url = '' THEN media_url
                          ELSE extensions.armor(extensions.pgp_sym_encrypt(media_url, k)) END,
        transcript = CASE WHEN transcript IS NULL OR transcript = '' THEN transcript
                          ELSE extensions.armor(extensions.pgp_sym_encrypt(transcript, k)) END,
        enc        = true
    WHERE NOT enc;
    EXECUTE 'ALTER TABLE public.dm_messages ENABLE TRIGGER dm_messages_media_guard';

    UPDATE public.dm_conversations SET
        last_message_preview = CASE
            WHEN last_message_preview IS NULL OR last_message_preview = '' THEN last_message_preview
            ELSE extensions.armor(extensions.pgp_sym_encrypt(last_message_preview, k)) END,
        preview_enc = true
    WHERE NOT preview_enc;
END $$;

DO $$
DECLARE
    k text;
BEGIN
    BEGIN
        k := public._vision_key();
    EXCEPTION WHEN OTHERS THEN
        k := NULL;
    END;
    IF k IS NULL THEN
        RAISE NOTICE 'sin llave de visión: no se cifra lo existente';
        RETURN;
    END IF;
    UPDATE public.vision_answers SET
        body = CASE WHEN body IS NULL OR body = '' THEN body
                    ELSE extensions.armor(extensions.pgp_sym_encrypt(body, k)) END,
        prompt_custom = CASE WHEN prompt_custom IS NULL OR prompt_custom = '' THEN prompt_custom
                    ELSE extensions.armor(extensions.pgp_sym_encrypt(prompt_custom, k)) END,
        enc = true
    WHERE NOT enc;
    UPDATE public.vision_board SET
        nombre = CASE WHEN nombre IS NULL OR nombre = '' THEN nombre
                      ELSE extensions.armor(extensions.pgp_sym_encrypt(nombre, k)) END,
        enc = true
    WHERE NOT enc;
    UPDATE public.vision_photos SET
        url = CASE WHEN url IS NULL OR url = '' THEN url
                   ELSE extensions.armor(extensions.pgp_sym_encrypt(url, k)) END,
        enc = true
    WHERE NOT enc;
    UPDATE public.vision_versions SET
        payload = CASE WHEN payload IS NULL OR payload = '' THEN payload
                       ELSE extensions.armor(extensions.pgp_sym_encrypt(payload, k)) END,
        enc = true
    WHERE NOT enc;
END $$;

-- =====================================================================
-- 1) TABLAS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.grp_groups (
    id              bigserial PRIMARY KEY,
    name            text        NOT NULL,
    description     text        NOT NULL DEFAULT '',
    photo_url       text,
    created_by      text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grp_members (
    group_id      bigint      NOT NULL REFERENCES public.grp_groups(id) ON DELETE CASCADE,
    clerk_user_id text        NOT NULL,
    role          text        NOT NULL DEFAULT 'member',
    muted         boolean     NOT NULL DEFAULT false,
    joined_at     timestamptz NOT NULL DEFAULT now(),
    last_read_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, clerk_user_id),
    CONSTRAINT grp_members_role_chk CHECK (role IN ('admin', 'member'))
);
CREATE INDEX IF NOT EXISTS idx_grp_members_user ON public.grp_members (clerk_user_id);

CREATE TABLE IF NOT EXISTS public.grp_messages (
    id              bigserial PRIMARY KEY,
    group_id        bigint      NOT NULL REFERENCES public.grp_groups(id) ON DELETE CASCADE,
    sender_clerk_id text        NOT NULL,
    kind            text        NOT NULL DEFAULT 'text',
    body            text        NOT NULL DEFAULT '',
    media_url       text,
    media_meta      jsonb,
    transcript      text,
    reply_to        bigint,
    enc             boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grp_messages_group ON public.grp_messages (group_id, id);

CREATE TABLE IF NOT EXISTS public.grp_hearts (
    message_id    bigint      NOT NULL REFERENCES public.grp_messages(id) ON DELETE CASCADE,
    clerk_user_id text        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, clerk_user_id)
);
CREATE INDEX IF NOT EXISTS idx_grp_hearts_user ON public.grp_hearts (clerk_user_id);

CREATE TABLE IF NOT EXISTS public.grp_invites (
    id           bigserial PRIMARY KEY,
    group_id     bigint      NOT NULL REFERENCES public.grp_groups(id) ON DELETE CASCADE,
    inviter_id   text        NOT NULL,
    invitee_id   text        NOT NULL,
    status       text        NOT NULL DEFAULT 'pendiente',
    created_at   timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    CONSTRAINT grp_invites_status_chk
        CHECK (status IN ('pendiente', 'aceptada', 'rechazada', 'cancelada'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_grp_invites_pend
    ON public.grp_invites (group_id, invitee_id) WHERE status = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_grp_invites_invitee ON public.grp_invites (invitee_id, status);

ALTER TABLE public.bitacora_notas
    ADD COLUMN IF NOT EXISTS version        integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_editor_id text;

CREATE TABLE IF NOT EXISTS public.bitacora_nota_members (
    nota_id       uuid        NOT NULL REFERENCES public.bitacora_notas(id) ON DELETE CASCADE,
    clerk_user_id text        NOT NULL,
    tag           text        NOT NULL DEFAULT '',
    pinned        boolean     NOT NULL DEFAULT false,
    favorite      boolean     NOT NULL DEFAULT false,
    added_by      text,
    added_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (nota_id, clerk_user_id)
);
CREATE INDEX IF NOT EXISTS idx_bitacora_nota_members_user
    ON public.bitacora_nota_members (clerk_user_id);

CREATE TABLE IF NOT EXISTS public.bitacora_nota_invites (
    id           bigserial PRIMARY KEY,
    nota_id      uuid        NOT NULL REFERENCES public.bitacora_notas(id) ON DELETE CASCADE,
    inviter_id   text        NOT NULL,
    invitee_id   text        NOT NULL,
    status       text        NOT NULL DEFAULT 'pendiente',
    created_at   timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    CONSTRAINT bitacora_nota_invites_status_chk
        CHECK (status IN ('pendiente', 'aceptada', 'rechazada', 'cancelada'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bitacora_nota_invites_pend
    ON public.bitacora_nota_invites (nota_id, invitee_id) WHERE status = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_bitacora_nota_invites_invitee
    ON public.bitacora_nota_invites (invitee_id, status);

-- Todas cerradas: solo las RPC (SECURITY DEFINER, por el gateway) las tocan.
ALTER TABLE public.grp_groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grp_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grp_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grp_hearts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grp_invites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_nota_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_nota_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.grp_groups, public.grp_members, public.grp_messages,
    public.grp_hearts, public.grp_invites, public.bitacora_nota_members,
    public.bitacora_nota_invites FROM anon, authenticated;

-- =====================================================================
-- 2) AYUDANTES
-- =====================================================================

-- Idioma del aparato más reciente del Tripulante (es | en).
CREATE OR REPLACE FUNCTION public._push_lang(p_clerk_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE WHEN lower(left(coalesce((
        SELECT lang FROM push_tokens
        WHERE clerk_user_id = p_clerk_user_id
        ORDER BY updated_at DESC LIMIT 1
    ), 'es'), 2)) = 'en' THEN 'en' ELSE 'es' END;
$$;

-- Nombre visible: alias de la Comunidad, si no el primer nombre del perfil.
-- Cadena vacía si no hay nada (el cliente/idioma pone "Tripulante").
CREATE OR REPLACE FUNCTION public._rsv_alias(p_clerk_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT NULLIF(TRIM(alias), '') FROM community_profiles
          WHERE clerk_user_id = p_clerk_user_id),
        (SELECT NULLIF(split_part(TRIM(COALESCE(full_name, '')), ' ', 1), '')
           FROM profiles WHERE clerk_user_id = p_clerk_user_id LIMIT 1),
        ''
    );
$$;

CREATE OR REPLACE FUNCTION public._rsv_avatar(p_clerk_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT selected_avatar FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id),
        'nova'
    );
$$;

-- ¿Son contactos? (conversación, grupo o nota en común)
CREATE OR REPLACE FUNCTION public._rsv_is_contact(a text, b text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM dm_conversations dc
        WHERE (dc.user_a = a AND dc.user_b = b) OR (dc.user_a = b AND dc.user_b = a)
    ) OR EXISTS (
        SELECT 1 FROM grp_members m1
        JOIN grp_members m2 ON m2.group_id = m1.group_id
        WHERE m1.clerk_user_id = a AND m2.clerk_user_id = b
    ) OR EXISTS (
        SELECT 1 FROM bitacora_notas n
        JOIN bitacora_nota_members m ON m.nota_id = n.id
        WHERE (n.clerk_user_id = a AND m.clerk_user_id = b)
           OR (n.clerk_user_id = b AND m.clerk_user_id = a)
    );
$$;

-- Resuelve a QUIÉN se invita. Por correo: cualquier cuenta (correo exacto).
-- Por id: perfil visible en la Comunidad o alguien con quien ya hay contacto.
CREATE OR REPLACE FUNCTION public._rsv_invite_target(p_me text, p_target text, p_email text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text := lower(trim(COALESCE(p_email, '')));
    v_tgt   text := trim(COALESCE(p_target, ''));
    v_id    text;
BEGIN
    IF p_me IS NULL OR length(trim(p_me)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF public._community_banned(p_me) THEN
        RETURN json_build_object('error', 'banned');
    END IF;

    IF v_email <> '' THEN
        SELECT clerk_user_id INTO v_id FROM profiles
        WHERE lower(trim(email)) = v_email
        LIMIT 1;
        IF v_id IS NULL THEN RETURN json_build_object('error', 'no_account'); END IF;
    ELSIF v_tgt <> '' THEN
        SELECT clerk_user_id INTO v_id FROM profiles WHERE clerk_user_id = v_tgt LIMIT 1;
        IF v_id IS NULL THEN RETURN json_build_object('error', 'no_account'); END IF;
        IF NOT (
            EXISTS (
                SELECT 1 FROM community_profiles cp
                WHERE cp.clerk_user_id = v_id
                  AND cp.visible
                  AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
            )
            OR public._rsv_is_contact(p_me, v_id)
        ) THEN
            RETURN json_build_object('error', 'unavailable');
        END IF;
    ELSE
        RETURN json_build_object('error', 'bad_target');
    END IF;

    IF v_id = p_me THEN RETURN json_build_object('error', 'self'); END IF;
    IF public._community_blocked(p_me, v_id) OR public._community_banned(v_id) THEN
        RETURN json_build_object('error', 'unavailable');
    END IF;
    RETURN json_build_object('ok', true, 'id', v_id);
END $$;

-- Texto de la vista previa de un mensaje para el aviso.
CREATE OR REPLACE FUNCTION public._msg_push_preview(p_kind text, p_body text, p_lang text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE COALESCE(p_kind, 'text')
        WHEN 'image'   THEN CASE WHEN p_lang = 'en' THEN '📷 Photo' ELSE '📷 Foto' END
        WHEN 'voice'   THEN CASE WHEN p_lang = 'en' THEN '🎤 Voice note' ELSE '🎤 Nota de voz' END
        WHEN 'sticker' THEN '✨ Sticker'
        ELSE CASE
            WHEN length(TRIM(COALESCE(p_body, ''))) > 180
                THEN left(TRIM(p_body), 177) || '…'
            ELSE TRIM(COALESCE(p_body, ''))
        END
    END;
$$;

-- Total de no leídos (mensajes privados + grupos no silenciados). Es el número
-- del ícono de la app y de los contadores de la Comunidad.
CREATE OR REPLACE FUNCTION public._rsv_unread_total(p_clerk_user_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_dm  int := 0;
    v_grp int := 0;
BEGIN
    BEGIN
        SELECT COALESCE(SUM(sub.u), 0)::int INTO v_dm
        FROM (
            SELECT (
                SELECT COUNT(*) FROM dm_messages m
                WHERE m.conversation_id = c.id
                  AND m.sender_clerk_id <> p_clerk_user_id
                  AND m.created_at > (CASE WHEN c.user_a = p_clerk_user_id
                                           THEN c.a_last_read_at
                                           ELSE c.b_last_read_at END)
            ) AS u
            FROM dm_conversations c
            WHERE (c.user_a = p_clerk_user_id OR c.user_b = p_clerk_user_id)
              AND NOT public._community_blocked(
                    p_clerk_user_id,
                    CASE WHEN c.user_a = p_clerk_user_id THEN c.user_b ELSE c.user_a END
                  )
        ) sub;
    EXCEPTION WHEN OTHERS THEN
        v_dm := 0;
    END;
    BEGIN
        SELECT COUNT(*)::int INTO v_grp
        FROM grp_members gm
        JOIN grp_messages m ON m.group_id = gm.group_id
        WHERE gm.clerk_user_id = p_clerk_user_id
          AND NOT gm.muted
          AND m.kind <> 'system'
          AND m.sender_clerk_id <> p_clerk_user_id
          AND m.created_at > gm.last_read_at
          AND m.created_at >= gm.joined_at;
    EXCEPTION WHEN OTHERS THEN
        v_grp := 0;
    END;
    RETURN COALESCE(v_dm, 0) + COALESCE(v_grp, 0);
END $$;

-- =====================================================================
-- 3) AVISO DE MENSAJE PRIVADO CON VISTA PREVIA
-- =====================================================================
CREATE OR REPLACE FUNCTION public._dm_notify_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_recipient text;
    v_alias     text;
    v_lang      text;
    v_prev      text;
    v_badge     int;
BEGIN
    SELECT CASE WHEN c.user_a = NEW.sender_clerk_id THEN c.user_b ELSE c.user_a END
    INTO v_recipient
    FROM dm_conversations c
    WHERE c.id = NEW.conversation_id;

    IF v_recipient IS NULL OR v_recipient = NEW.sender_clerk_id THEN
        RETURN NEW;
    END IF;

    v_lang  := public._push_lang(v_recipient);
    v_alias := NULLIF(public._rsv_alias(NEW.sender_clerk_id), '');
    v_prev  := public._msg_push_preview(NEW.kind, public._dm_decrypt(NEW.body, NEW.enc), v_lang);
    IF v_prev IS NULL OR v_prev = '' THEN
        v_prev := CASE WHEN v_lang = 'en' THEN 'Sent you a message' ELSE 'Te envió un mensaje' END;
    END IF;
    v_badge := public._rsv_unread_total(v_recipient);

    PERFORM public._push_dispatch(
        v_recipient,
        COALESCE(v_alias, CASE WHEN v_lang = 'en' THEN 'A Crew Member' ELSE 'Un Tripulante' END),
        v_prev,
        jsonb_build_object(
            'type', 'dm',
            'conversation_id', NEW.conversation_id,
            'thread_id', 'dm-' || NEW.conversation_id
        ),
        GREATEST(COALESCE(v_badge, 1), 1)
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END $$;

-- =====================================================================
-- 4) GRUPOS · internos
-- =====================================================================

-- Evento de sistema dentro del grupo ("Andy se unió", "cambió el nombre").
-- Solo guarda ids y datos; el texto lo arma la app en el idioma de quien lee.
CREATE OR REPLACE FUNCTION public._grp_system(
    p_gid bigint, p_actor text, p_ev text,
    p_target text DEFAULT NULL, p_extra jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO grp_messages (group_id, sender_clerk_id, kind, body, media_meta)
    VALUES (
        p_gid, COALESCE(p_actor, ''), 'system', '',
        jsonb_strip_nulls(jsonb_build_object('ev', p_ev, 'target', p_target))
            || COALESCE(p_extra, '{}'::jsonb)
    );
    UPDATE grp_groups SET last_message_at = now(), updated_at = now() WHERE id = p_gid;
END $$;

CREATE OR REPLACE FUNCTION public._grp_is_member(p_gid bigint, p_uid text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM grp_members WHERE group_id = p_gid AND clerk_user_id = p_uid);
$$;

CREATE OR REPLACE FUNCTION public._grp_is_admin(p_gid bigint, p_uid text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM grp_members
        WHERE group_id = p_gid AND clerk_user_id = p_uid AND role = 'admin'
    );
$$;

-- Si el grupo se quedó sin administrador, el miembro más antiguo lo es.
-- Si se quedó sin nadie, el grupo desaparece.
CREATE OR REPLACE FUNCTION public._grp_fix_admins(p_gid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_next text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM grp_members WHERE group_id = p_gid) THEN
        DELETE FROM grp_groups WHERE id = p_gid;
        RETURN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM grp_members WHERE group_id = p_gid AND role = 'admin') THEN
        SELECT clerk_user_id INTO v_next FROM grp_members
        WHERE group_id = p_gid ORDER BY joined_at ASC, clerk_user_id ASC LIMIT 1;
        UPDATE grp_members SET role = 'admin' WHERE group_id = p_gid AND clerk_user_id = v_next;
        PERFORM public._grp_system(p_gid, v_next, 'auto_admin', v_next, NULL);
    END IF;
END $$;

-- Invita a UNA persona a un grupo (solo administradores). Tope: 10 entre
-- miembros e invitaciones pendientes.
CREATE OR REPLACE FUNCTION public._grp_invite_one(
    p_gid bigint, p_me text, p_target text, p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_t     json;
    v_id    text;
    v_count int;
    v_name  text;
    v_lang  text;
    v_alias text;
    v_iid   bigint;
BEGIN
    IF NOT public._grp_is_admin(p_gid, p_me) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;
    v_t := public._rsv_invite_target(p_me, p_target, p_email);
    IF (v_t->>'error') IS NOT NULL THEN RETURN v_t; END IF;
    v_id := v_t->>'id';

    IF public._grp_is_member(p_gid, v_id) THEN
        RETURN json_build_object('error', 'already_member',
            'alias', public._rsv_alias(v_id));
    END IF;
    IF EXISTS (SELECT 1 FROM grp_invites
               WHERE group_id = p_gid AND invitee_id = v_id AND status = 'pendiente') THEN
        RETURN json_build_object('ok', true, 'already_invited', true,
            'alias', public._rsv_alias(v_id));
    END IF;

    SELECT (SELECT COUNT(*) FROM grp_members WHERE group_id = p_gid)
         + (SELECT COUNT(*) FROM grp_invites WHERE group_id = p_gid AND status = 'pendiente')
      INTO v_count;
    IF v_count >= 10 THEN RETURN json_build_object('error', 'group_full'); END IF;

    INSERT INTO grp_invites (group_id, inviter_id, invitee_id)
    VALUES (p_gid, p_me, v_id)
    RETURNING id INTO v_iid;

    SELECT name INTO v_name FROM grp_groups WHERE id = p_gid;
    v_lang  := public._push_lang(v_id);
    v_alias := NULLIF(public._rsv_alias(p_me), '');
    PERFORM public._push_dispatch(
        v_id,
        CASE WHEN v_lang = 'en' THEN 'Group invite' ELSE 'Invitación a un grupo' END,
        CASE WHEN v_lang = 'en'
            THEN COALESCE(v_alias, 'A Crew Member') || ' invited you to “' || v_name || '”'
            ELSE COALESCE(v_alias, 'Un Tripulante') || ' te invita a «' || v_name || '»'
        END,
        jsonb_build_object('type', 'grp_invite', 'group_id', p_gid, 'invite_id', v_iid),
        NULL
    );

    RETURN json_build_object('ok', true, 'invite_id', v_iid,
        'alias', public._rsv_alias(v_id));
END $$;

-- Guardia de medios: fotos y notas de voz solo desde nuestro R2.
CREATE OR REPLACE FUNCTION public._grp_media_guard_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_plain text;
BEGIN
    IF NEW.kind IS NULL OR NEW.kind NOT IN ('image', 'voice') THEN RETURN NEW; END IF;
    IF NEW.media_url IS NULL THEN RETURN NEW; END IF;
    v_plain := public._dm_decrypt(NEW.media_url, NEW.enc);
    IF NOT public._dm_media_host_ok(v_plain) THEN
        NEW.media_url := NULL;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    NEW.media_url := NULL;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS grp_messages_media_guard ON public.grp_messages;
CREATE TRIGGER grp_messages_media_guard
    BEFORE INSERT OR UPDATE ON public.grp_messages
    FOR EACH ROW EXECUTE FUNCTION public._grp_media_guard_tg();

-- Aviso a cada miembro (menos quien envía, quien lo silenció o quien lo
-- bloqueó): título = nombre del grupo, cuerpo = "Andy: texto".
CREATE OR REPLACE FUNCTION public._grp_notify_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    r        record;
    v_name   text;
    v_alias  text;
    v_plain  text;
    v_lang   text;
    v_badge  int;
BEGIN
    IF NEW.kind = 'system' THEN RETURN NEW; END IF;
    SELECT name INTO v_name FROM grp_groups WHERE id = NEW.group_id;
    v_alias := NULLIF(public._rsv_alias(NEW.sender_clerk_id), '');
    v_plain := public._dm_decrypt(NEW.body, NEW.enc);

    FOR r IN
        SELECT gm.clerk_user_id FROM grp_members gm
        WHERE gm.group_id = NEW.group_id
          AND gm.clerk_user_id <> NEW.sender_clerk_id
          AND NOT gm.muted
          AND NOT public._community_blocked(gm.clerk_user_id, NEW.sender_clerk_id)
    LOOP
        BEGIN
            v_lang  := public._push_lang(r.clerk_user_id);
            v_badge := public._rsv_unread_total(r.clerk_user_id);
            PERFORM public._push_dispatch(
                r.clerk_user_id,
                COALESCE(v_name, CASE WHEN v_lang = 'en' THEN 'Group' ELSE 'Grupo' END),
                COALESCE(v_alias, CASE WHEN v_lang = 'en' THEN 'A Crew Member' ELSE 'Un Tripulante' END)
                    || ': ' || public._msg_push_preview(NEW.kind, v_plain, v_lang),
                jsonb_build_object(
                    'type', 'grp',
                    'group_id', NEW.group_id,
                    'thread_id', 'grp-' || NEW.group_id
                ),
                GREATEST(COALESCE(v_badge, 1), 1)
            );
        EXCEPTION WHEN OTHERS THEN
            NULL;  -- un aviso fallido nunca frena a los demás ni al mensaje
        END;
    END LOOP;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_grp_notify ON public.grp_messages;
CREATE TRIGGER trg_grp_notify
    AFTER INSERT ON public.grp_messages
    FOR EACH ROW EXECUTE FUNCTION public._grp_notify_members();

-- =====================================================================
-- 5) GRUPOS · RPC (gateway user-action inyecta p_clerk_user_id)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.grp_create(
    p_clerk_user_id text,
    p_name          text,
    p_description   text  DEFAULT '',
    p_photo_url     text  DEFAULT NULL,
    p_invitees      jsonb DEFAULT '[]'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me      text  := p_clerk_user_id;
    v_name  text  := left(TRIM(COALESCE(p_name, '')), 60);
    v_desc  text  := left(TRIM(COALESCE(p_description, '')), 280);
    v_photo text  := NULLIF(TRIM(COALESCE(p_photo_url, '')), '');
    v_gid   bigint;
    v_count int;
    v_res   json;
    v_out   jsonb := '[]'::jsonb;
    x       jsonb;
BEGIN
    IF me IS NULL OR length(trim(me)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF v_name = '' THEN RETURN json_build_object('error', 'no_name'); END IF;
    IF public._community_banned(me) THEN RETURN json_build_object('error', 'banned'); END IF;
    IF v_photo IS NOT NULL AND NOT public._dm_media_host_ok(v_photo) THEN v_photo := NULL; END IF;

    SELECT COUNT(*) INTO v_count FROM grp_members
    WHERE clerk_user_id = me AND role = 'admin';
    IF v_count >= 30 THEN RETURN json_build_object('error', 'limit_groups'); END IF;

    INSERT INTO grp_groups (name, description, photo_url, created_by)
    VALUES (v_name, v_desc, v_photo, me)
    RETURNING id INTO v_gid;
    INSERT INTO grp_members (group_id, clerk_user_id, role) VALUES (v_gid, me, 'admin');
    PERFORM public._grp_system(v_gid, me, 'created', NULL, jsonb_build_object('name', v_name));

    IF jsonb_typeof(COALESCE(p_invitees, '[]'::jsonb)) = 'array' THEN
        FOR x IN SELECT value FROM jsonb_array_elements(COALESCE(p_invitees, '[]'::jsonb)) LOOP
            v_res := public._grp_invite_one(v_gid, me, x->>'id', x->>'email');
            v_out := v_out || jsonb_build_array(
                jsonb_build_object('key', COALESCE(x->>'id', x->>'email', ''), 'result', v_res::jsonb)
            );
        END LOOP;
    END IF;

    RETURN json_build_object('ok', true, 'group_id', v_gid, 'invites', v_out);
END $$;

CREATE OR REPLACE FUNCTION public.grp_invite(
    p_clerk_user_id   text,
    p_group_id        bigint,
    p_target_clerk_id text DEFAULT NULL,
    p_email           text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public._grp_invite_one(p_group_id, p_clerk_user_id, p_target_clerk_id, p_email);
END $$;

CREATE OR REPLACE FUNCTION public.grp_get_my_invites(p_clerk_user_id text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(json_agg(json_build_object(
        'invite_id',      i.id,
        'group_id',       g.id,
        'group_name',     g.name,
        'group_photo',    g.photo_url,
        'inviter_alias',  public._rsv_alias(i.inviter_id),
        'inviter_avatar', public._rsv_avatar(i.inviter_id),
        'member_count',   (SELECT COUNT(*) FROM grp_members x WHERE x.group_id = g.id),
        'created_at',     i.created_at
    ) ORDER BY i.created_at DESC), '[]'::json)
    FROM grp_invites i
    JOIN grp_groups g ON g.id = i.group_id
    WHERE i.invitee_id = p_clerk_user_id
      AND i.status = 'pendiente'
      AND NOT public._community_blocked(p_clerk_user_id, i.inviter_id);
$$;

CREATE OR REPLACE FUNCTION public.grp_respond_invite(
    p_clerk_user_id text,
    p_invite_id     bigint,
    p_accept        boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inv     grp_invites%ROWTYPE;
    v_count int;
BEGIN
    SELECT * INTO inv FROM grp_invites
    WHERE id = p_invite_id AND invitee_id = p_clerk_user_id
    FOR UPDATE;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF inv.status <> 'pendiente' THEN
        RETURN json_build_object('error', 'not_pending', 'status', inv.status);
    END IF;

    IF NOT COALESCE(p_accept, false) THEN
        UPDATE grp_invites SET status = 'rechazada', responded_at = now() WHERE id = inv.id;
        RETURN json_build_object('ok', true, 'accepted', false);
    END IF;

    IF public._community_blocked(p_clerk_user_id, inv.inviter_id) THEN
        UPDATE grp_invites SET status = 'cancelada', responded_at = now() WHERE id = inv.id;
        RETURN json_build_object('error', 'unavailable');
    END IF;

    SELECT COUNT(*) INTO v_count FROM grp_members WHERE group_id = inv.group_id;
    IF v_count >= 10 THEN RETURN json_build_object('error', 'group_full'); END IF;

    INSERT INTO grp_members (group_id, clerk_user_id, role, joined_at, last_read_at)
    VALUES (inv.group_id, p_clerk_user_id, 'member', now(), now())
    ON CONFLICT (group_id, clerk_user_id) DO NOTHING;
    UPDATE grp_invites SET status = 'aceptada', responded_at = now() WHERE id = inv.id;
    PERFORM public._grp_system(inv.group_id, p_clerk_user_id, 'joined', NULL, NULL);

    RETURN json_build_object('ok', true, 'accepted', true, 'group_id', inv.group_id,
        'group_name', (SELECT name FROM grp_groups WHERE id = inv.group_id),
        'group_photo', (SELECT photo_url FROM grp_groups WHERE id = inv.group_id));
END $$;

CREATE OR REPLACE FUNCTION public.grp_cancel_invite(p_clerk_user_id text, p_invite_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inv grp_invites%ROWTYPE;
BEGIN
    SELECT * INTO inv FROM grp_invites WHERE id = p_invite_id;
    IF NOT FOUND OR inv.status <> 'pendiente' THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    IF inv.inviter_id <> p_clerk_user_id AND NOT public._grp_is_admin(inv.group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;
    UPDATE grp_invites SET status = 'cancelada', responded_at = now() WHERE id = inv.id;
    RETURN json_build_object('ok', true);
END $$;

-- Bandeja: mis grupos con el último mensaje y los no leídos.
CREATE OR REPLACE FUNCTION public.grp_get_my_groups(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    me     text := p_clerk_user_id;
    result json;
BEGIN
    SELECT COALESCE(json_agg(row_to_json(x) ORDER BY x.last_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT
            g.id AS group_id,
            g.name,
            g.photo_url,
            m.role,
            m.muted,
            (SELECT COUNT(*) FROM grp_members z WHERE z.group_id = g.id)::int AS member_count,
            lm.kind AS last_kind,
            lm.sender_clerk_id AS last_sender_id,
            (lm.sender_clerk_id = me) AS last_mine,
            CASE WHEN lm.id IS NULL THEN NULL
                 ELSE public._rsv_alias(lm.sender_clerk_id) END AS last_sender_alias,
            CASE WHEN lm.kind = 'text'
                 THEN left(public._dm_decrypt(lm.body, lm.enc), 140) ELSE '' END AS last_body,
            lm.media_meta AS last_meta,
            CASE WHEN lm.kind = 'system' AND lm.media_meta ? 'target'
                 THEN public._rsv_alias(lm.media_meta->>'target') END AS last_target_alias,
            COALESCE(lm.created_at, g.created_at) AS last_at,
            (
                SELECT COUNT(*) FROM grp_messages gm
                WHERE gm.group_id = g.id
                  AND gm.kind <> 'system'
                  AND gm.sender_clerk_id <> me
                  AND gm.created_at > m.last_read_at
                  AND gm.created_at >= m.joined_at
            )::int AS unread
        FROM grp_members m
        JOIN grp_groups g ON g.id = m.group_id
        LEFT JOIN LATERAL (
            SELECT * FROM grp_messages mm
            WHERE mm.group_id = g.id AND mm.created_at >= m.joined_at
            ORDER BY mm.id DESC LIMIT 1
        ) lm ON true
        WHERE m.clerk_user_id = me
    ) x;
    RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.grp_get_info(p_clerk_user_id text, p_group_id bigint)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me    text := p_clerk_user_id;
    g     grp_groups%ROWTYPE;
    mine  grp_members%ROWTYPE;
BEGIN
    SELECT * INTO mine FROM grp_members WHERE group_id = p_group_id AND clerk_user_id = me;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_member'); END IF;
    SELECT * INTO g FROM grp_groups WHERE id = p_group_id;

    RETURN json_build_object(
        'ok', true,
        'group', json_build_object(
            'id', g.id, 'name', g.name, 'description', g.description,
            'photo_url', g.photo_url, 'created_by', g.created_by,
            'created_at', g.created_at
        ),
        'my_role', mine.role,
        'muted', mine.muted,
        'members', COALESCE((
            SELECT json_agg(json_build_object(
                'id', m.clerk_user_id,
                'alias', public._rsv_alias(m.clerk_user_id),
                'avatar', public._rsv_avatar(m.clerk_user_id),
                'role', m.role,
                'joined_at', m.joined_at,
                'is_me', m.clerk_user_id = me
            ) ORDER BY (m.role = 'admin') DESC, m.joined_at ASC)
            FROM grp_members m WHERE m.group_id = p_group_id
        ), '[]'::json),
        'invites', CASE WHEN mine.role = 'admin' THEN COALESCE((
            SELECT json_agg(json_build_object(
                'invite_id', i.id,
                'alias', public._rsv_alias(i.invitee_id),
                'avatar', public._rsv_avatar(i.invitee_id),
                'created_at', i.created_at
            ) ORDER BY i.created_at DESC)
            FROM grp_invites i WHERE i.group_id = p_group_id AND i.status = 'pendiente'
        ), '[]'::json) ELSE '[]'::json END
    );
END $$;

CREATE OR REPLACE FUNCTION public.grp_get_messages(
    p_clerk_user_id text,
    p_group_id      bigint,
    p_limit         integer DEFAULT 50,
    p_before_id     bigint  DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    me    text := p_clerk_user_id;
    mine  grp_members%ROWTYPE;
    g     grp_groups%ROWTYPE;
    lim   int := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 80);
    msgs  json;
BEGIN
    SELECT * INTO mine FROM grp_members WHERE group_id = p_group_id AND clerk_user_id = me;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_member'); END IF;
    SELECT * INTO g FROM grp_groups WHERE id = p_group_id;

    SELECT COALESCE(json_agg(row_to_json(m2) ORDER BY m2.id ASC), '[]'::json)
    INTO msgs
    FROM (
        SELECT
            m.id,
            m.sender_clerk_id,
            public._dm_decrypt(m.body, m.enc) AS body,
            m.kind,
            public._dm_decrypt(m.media_url, m.enc) AS media_url,
            m.media_meta,
            public._dm_decrypt(m.transcript, m.enc) AS transcript,
            m.reply_to,
            m.created_at,
            (m.sender_clerk_id = me) AS mine,
            public._rsv_alias(m.sender_clerk_id) AS sender_alias,
            public._rsv_avatar(m.sender_clerk_id) AS sender_avatar,
            CASE WHEN m.kind = 'system' AND m.media_meta ? 'target'
                 THEN public._rsv_alias(m.media_meta->>'target') END AS target_alias,
            (SELECT COUNT(*) FROM grp_hearts h WHERE h.message_id = m.id)::int AS heart_count,
            EXISTS (SELECT 1 FROM grp_hearts h
                    WHERE h.message_id = m.id AND h.clerk_user_id = me) AS hearted_by_me
        FROM grp_messages m
        WHERE m.group_id = p_group_id
          AND m.created_at >= mine.joined_at
          AND (p_before_id IS NULL OR m.id < p_before_id)
        ORDER BY m.id DESC
        LIMIT lim
    ) m2;

    RETURN json_build_object(
        'ok', true,
        'messages', msgs,
        'group', json_build_object(
            'id', g.id, 'name', g.name, 'photo_url', g.photo_url,
            'member_count', (SELECT COUNT(*) FROM grp_members z WHERE z.group_id = g.id)
        ),
        'my_role', mine.role,
        'muted', mine.muted,
        'member_ids', COALESCE((SELECT json_agg(z.clerk_user_id) FROM grp_members z
                                WHERE z.group_id = p_group_id), '[]'::json)
    );
END $$;

CREATE OR REPLACE FUNCTION public.grp_send_message(
    p_clerk_user_id text,
    p_group_id      bigint,
    p_body          text,
    p_kind          text   DEFAULT 'text',
    p_media_url     text   DEFAULT NULL,
    p_media_meta    jsonb  DEFAULT NULL,
    p_reply_to      bigint DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    me        text   := p_clerk_user_id;
    v_kind    text   := LOWER(COALESCE(NULLIF(TRIM(p_kind), ''), 'text'));
    v_body    text   := left(TRIM(COALESCE(p_body, '')), 2000);
    v_media   text   := NULLIF(TRIM(COALESCE(p_media_url, '')), '');
    v_meta    jsonb  := p_media_meta;
    v_reply   bigint := p_reply_to;
    v_key     text;
    v_stored  text;
    v_mstored text;
    v_enc     boolean := false;
    v_sid     bigint;
    v_surl    text;
    v_premium boolean;
    v_pack    bigint;
    mid       bigint;
    ts        timestamptz;
BEGIN
    IF v_kind NOT IN ('text', 'image', 'voice', 'sticker') THEN v_kind := 'text'; END IF;
    IF NOT public._grp_is_member(p_group_id, me) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    IF public._community_banned(me) THEN RETURN json_build_object('error', 'banned'); END IF;

    IF v_reply IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM grp_messages WHERE id = v_reply AND group_id = p_group_id
    ) THEN
        v_reply := NULL;
    END IF;

    IF v_kind = 'sticker' THEN
        v_sid := NULLIF(TRIM(COALESCE(p_media_meta->>'sticker_id', '')), '')::bigint;
        IF v_sid IS NULL THEN RETURN json_build_object('error', 'no_sticker'); END IF;
        SELECT s.image_url, sp.is_premium, s.pack_id
          INTO v_surl, v_premium, v_pack
          FROM stickers s JOIN sticker_packs sp ON sp.id = s.pack_id
          WHERE s.id = v_sid AND s.is_active AND sp.is_active;
        IF v_surl IS NULL THEN RETURN json_build_object('error', 'no_sticker'); END IF;
        IF v_premium AND NOT public._is_active_member(me) THEN
            RETURN json_build_object('error', 'locked');
        END IF;
        v_media := v_surl;
        v_meta  := jsonb_build_object('pack_id', v_pack, 'sticker_id', v_sid);
    ELSIF v_kind IN ('image', 'voice') THEN
        IF v_media IS NULL THEN RETURN json_build_object('error', 'no_media'); END IF;
    ELSE
        IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;
    END IF;

    v_key := public._dm_key();
    IF v_key IS NOT NULL THEN
        BEGIN
            v_stored  := armor(pgp_sym_encrypt(v_body, v_key));
            v_mstored := CASE WHEN v_media IS NULL THEN NULL
                              ELSE armor(pgp_sym_encrypt(v_media, v_key)) END;
            v_enc     := true;
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_body; v_mstored := v_media; v_enc := false;
        END;
    ELSE
        v_stored := v_body; v_mstored := v_media;
    END IF;

    INSERT INTO grp_messages (group_id, sender_clerk_id, kind, body, media_url, media_meta, enc, reply_to)
    VALUES (p_group_id, me, v_kind, v_stored, v_mstored, v_meta, v_enc, v_reply)
    RETURNING id, created_at INTO mid, ts;

    UPDATE grp_groups SET last_message_at = ts WHERE id = p_group_id;
    UPDATE grp_members SET last_read_at = ts WHERE group_id = p_group_id AND clerk_user_id = me;

    RETURN json_build_object(
        'ok', true, 'message_id', mid, 'created_at', ts,
        'media_url', v_media,
        'member_ids', COALESCE((SELECT json_agg(z.clerk_user_id) FROM grp_members z
                                WHERE z.group_id = p_group_id), '[]'::json)
    );
END $$;

CREATE OR REPLACE FUNCTION public.grp_mark_read(p_clerk_user_id text, p_group_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE grp_members SET last_read_at = now()
    WHERE group_id = p_group_id AND clerk_user_id = p_clerk_user_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_member'); END IF;
    RETURN json_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.grp_react_message(
    p_clerk_user_id text,
    p_message_id    bigint,
    p_hearted       boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    msg grp_messages%ROWTYPE;
BEGIN
    SELECT * INTO msg FROM grp_messages WHERE id = p_message_id;
    IF NOT FOUND OR msg.kind = 'system' THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF NOT public._grp_is_member(msg.group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    IF msg.sender_clerk_id = p_clerk_user_id THEN
        RETURN json_build_object('error', 'own_message');
    END IF;
    IF COALESCE(p_hearted, false) THEN
        INSERT INTO grp_hearts (message_id, clerk_user_id) VALUES (p_message_id, p_clerk_user_id)
        ON CONFLICT DO NOTHING;
    ELSE
        DELETE FROM grp_hearts WHERE message_id = p_message_id AND clerk_user_id = p_clerk_user_id;
    END IF;
    RETURN json_build_object(
        'ok', true,
        'hearted', COALESCE(p_hearted, false),
        'heart_count', (SELECT COUNT(*) FROM grp_hearts WHERE message_id = p_message_id)
    );
END $$;

CREATE OR REPLACE FUNCTION public.grp_update(
    p_clerk_user_id text,
    p_group_id      bigint,
    p_name          text    DEFAULT NULL,
    p_description   text    DEFAULT NULL,
    p_photo_url     text    DEFAULT NULL,
    p_clear_photo   boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    g       grp_groups%ROWTYPE;
    v_name  text := NULLIF(left(TRIM(COALESCE(p_name, '')), 60), '');
    v_desc  text := CASE WHEN p_description IS NULL THEN NULL
                         ELSE left(TRIM(p_description), 280) END;
    v_photo text := NULLIF(TRIM(COALESCE(p_photo_url, '')), '');
BEGIN
    IF NOT public._grp_is_admin(p_group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;
    SELECT * INTO g FROM grp_groups WHERE id = p_group_id FOR UPDATE;

    IF v_name IS NOT NULL AND v_name <> g.name THEN
        UPDATE grp_groups SET name = v_name, updated_at = now() WHERE id = p_group_id;
        PERFORM public._grp_system(p_group_id, p_clerk_user_id, 'renamed', NULL,
            jsonb_build_object('name', v_name));
    END IF;
    IF v_desc IS NOT NULL AND v_desc <> g.description THEN
        UPDATE grp_groups SET description = v_desc, updated_at = now() WHERE id = p_group_id;
        PERFORM public._grp_system(p_group_id, p_clerk_user_id, 'description', NULL, NULL);
    END IF;
    IF COALESCE(p_clear_photo, false) AND g.photo_url IS NOT NULL THEN
        UPDATE grp_groups SET photo_url = NULL, updated_at = now() WHERE id = p_group_id;
        PERFORM public._grp_system(p_group_id, p_clerk_user_id, 'photo_removed', NULL, NULL);
    ELSIF v_photo IS NOT NULL AND public._dm_media_host_ok(v_photo)
          AND v_photo IS DISTINCT FROM g.photo_url THEN
        UPDATE grp_groups SET photo_url = v_photo, updated_at = now() WHERE id = p_group_id;
        PERFORM public._grp_system(p_group_id, p_clerk_user_id, 'photo', NULL, NULL);
    END IF;
    RETURN json_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.grp_set_role(
    p_clerk_user_id   text,
    p_group_id        bigint,
    p_target_clerk_id text,
    p_role            text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role text := CASE WHEN p_role = 'admin' THEN 'admin' ELSE 'member' END;
    v_cur  text;
BEGIN
    IF NOT public._grp_is_admin(p_group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;
    SELECT role INTO v_cur FROM grp_members
    WHERE group_id = p_group_id AND clerk_user_id = p_target_clerk_id;
    IF v_cur IS NULL THEN RETURN json_build_object('error', 'not_member'); END IF;
    IF v_cur = v_role THEN RETURN json_build_object('ok', true); END IF;
    IF v_role = 'member' AND (
        SELECT COUNT(*) FROM grp_members WHERE group_id = p_group_id AND role = 'admin'
    ) <= 1 THEN
        RETURN json_build_object('error', 'last_admin');
    END IF;
    UPDATE grp_members SET role = v_role
    WHERE group_id = p_group_id AND clerk_user_id = p_target_clerk_id;
    PERFORM public._grp_system(p_group_id, p_clerk_user_id,
        CASE WHEN v_role = 'admin' THEN 'admin_on' ELSE 'admin_off' END,
        p_target_clerk_id, NULL);
    RETURN json_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.grp_remove_member(
    p_clerk_user_id   text,
    p_group_id        bigint,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public._grp_is_admin(p_group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;
    IF p_target_clerk_id = p_clerk_user_id THEN
        RETURN json_build_object('error', 'use_leave');
    END IF;
    DELETE FROM grp_members WHERE group_id = p_group_id AND clerk_user_id = p_target_clerk_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_member'); END IF;
    PERFORM public._grp_system(p_group_id, p_clerk_user_id, 'removed', p_target_clerk_id, NULL);
    PERFORM public._grp_fix_admins(p_group_id);
    RETURN json_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.grp_leave(p_clerk_user_id text, p_group_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ids json;
BEGIN
    IF NOT public._grp_is_member(p_group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    DELETE FROM grp_members WHERE group_id = p_group_id AND clerk_user_id = p_clerk_user_id;
    IF EXISTS (SELECT 1 FROM grp_members WHERE group_id = p_group_id) THEN
        PERFORM public._grp_system(p_group_id, p_clerk_user_id, 'left', NULL, NULL);
    END IF;
    SELECT COALESCE(json_agg(clerk_user_id), '[]'::json) INTO v_ids
    FROM grp_members WHERE group_id = p_group_id;
    PERFORM public._grp_fix_admins(p_group_id);
    RETURN json_build_object('ok', true, 'member_ids', v_ids);
END $$;

CREATE OR REPLACE FUNCTION public.grp_set_mute(
    p_clerk_user_id text,
    p_group_id      bigint,
    p_muted         boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE grp_members SET muted = COALESCE(p_muted, false)
    WHERE group_id = p_group_id AND clerk_user_id = p_clerk_user_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_member'); END IF;
    RETURN json_build_object('ok', true, 'muted', COALESCE(p_muted, false));
END $$;

CREATE OR REPLACE FUNCTION public.grp_delete(p_clerk_user_id text, p_group_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ids json;
BEGIN
    IF NOT public._grp_is_admin(p_group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;
    SELECT COALESCE(json_agg(clerk_user_id), '[]'::json) INTO v_ids
    FROM grp_members WHERE group_id = p_group_id;
    DELETE FROM grp_groups WHERE id = p_group_id;
    RETURN json_build_object('ok', true, 'member_ids', v_ids);
END $$;

-- Transcripción en la nube de una nota de voz de grupo (solo miembros de
-- Sintonía, tope mensual compartido con los mensajes privados).
CREATE OR REPLACE FUNCTION public.grp_transcribe_voice_check(p_clerk_user_id text, p_message_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    m      grp_messages%ROWTYPE;
    v_used int := 0;
    v_cap  int := 150;
    v_ym   text := to_char(now() AT TIME ZONE 'America/Cancun', 'YYYY-MM');
BEGIN
    SELECT * INTO m FROM grp_messages WHERE id = p_message_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_message'); END IF;
    IF m.kind <> 'voice' THEN RETURN json_build_object('error', 'not_voice'); END IF;
    IF NOT public._grp_is_member(m.group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF NOT public._is_active_member(p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    SELECT COALESCE(count, 0) INTO v_used FROM voice_transcript_usage
    WHERE clerk_user_id = p_clerk_user_id AND ym = v_ym;
    RETURN json_build_object(
        'ok', true,
        'media_url', public._dm_decrypt(m.media_url, m.enc),
        'transcript', public._dm_decrypt(m.transcript, m.enc),
        'cap_left', GREATEST(0, v_cap - COALESCE(v_used, 0))
    );
END $$;

CREATE OR REPLACE FUNCTION public.grp_set_voice_transcript(
    p_clerk_user_id text, p_message_id bigint, p_text text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    m        grp_messages%ROWTYPE;
    v_key    text;
    v_stored text;
    v_txt    text := left(TRIM(COALESCE(p_text, '')), 4000);
    v_ym     text := to_char(now() AT TIME ZONE 'America/Cancun', 'YYYY-MM');
BEGIN
    IF length(v_txt) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;
    SELECT * INTO m FROM grp_messages WHERE id = p_message_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_message'); END IF;
    IF NOT public._grp_is_member(m.group_id, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF NOT public._is_active_member(p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    v_key := public._dm_key();
    IF m.enc AND v_key IS NOT NULL THEN
        BEGIN
            v_stored := armor(pgp_sym_encrypt(v_txt, v_key));
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_txt;
        END;
    ELSE
        v_stored := v_txt;
    END IF;
    UPDATE grp_messages SET transcript = v_stored WHERE id = p_message_id;
    INSERT INTO voice_transcript_usage (clerk_user_id, ym, count)
    VALUES (p_clerk_user_id, v_ym, 1)
    ON CONFLICT (clerk_user_id, ym) DO UPDATE SET count = voice_transcript_usage.count + 1;
    RETURN json_build_object('ok', true, 'transcript', v_txt);
END $$;

-- =====================================================================
-- 6) CONTACTOS Y BÚSQUEDA (el selector de "Invitar")
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rsv_get_my_contacts(p_clerk_user_id text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH c AS (
        SELECT CASE WHEN dc.user_a = p_clerk_user_id THEN dc.user_b ELSE dc.user_a END AS id,
               COALESCE(dc.last_message_at, dc.created_at) AS at
        FROM dm_conversations dc
        WHERE dc.user_a = p_clerk_user_id OR dc.user_b = p_clerk_user_id
        UNION ALL
        SELECT m2.clerk_user_id, GREATEST(m1.joined_at, m2.joined_at)
        FROM grp_members m1
        JOIN grp_members m2 ON m2.group_id = m1.group_id AND m2.clerk_user_id <> p_clerk_user_id
        WHERE m1.clerk_user_id = p_clerk_user_id
        UNION ALL
        SELECT CASE WHEN n.clerk_user_id = p_clerk_user_id THEN bm.clerk_user_id ELSE n.clerk_user_id END,
               bm.added_at
        FROM bitacora_nota_members bm
        JOIN bitacora_notas n ON n.id = bm.nota_id
        WHERE n.clerk_user_id = p_clerk_user_id OR bm.clerk_user_id = p_clerk_user_id
    ),
    agg AS (
        SELECT id, MAX(at) AS at FROM c
        WHERE id IS NOT NULL AND id <> p_clerk_user_id
        GROUP BY id
    ),
    ok AS (
        SELECT a.id, a.at FROM agg a
        WHERE NOT public._community_blocked(p_clerk_user_id, a.id)
          AND NOT public._community_banned(a.id)
        ORDER BY a.at DESC NULLS LAST
        LIMIT 200
    )
    SELECT COALESCE(json_agg(json_build_object(
        'id', ok.id,
        'alias', public._rsv_alias(ok.id),
        'avatar', public._rsv_avatar(ok.id)
    ) ORDER BY ok.at DESC NULLS LAST), '[]'::json)
    FROM ok;
$$;

CREATE OR REPLACE FUNCTION public.rsv_search_tripulantes(p_clerk_user_id text, p_query text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    q text := lower(translate(TRIM(COALESCE(p_query, '')),
        'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòù', 'AEIOUUNaeiouunAEIOUaeiou'));
    result json;
BEGIN
    IF length(q) < 2 THEN RETURN '[]'::json; END IF;
    q := replace(replace(replace(q, '\', ''), '%', ''), '_', '');
    SELECT COALESCE(json_agg(json_build_object(
        'id', x.clerk_user_id, 'alias', x.alias, 'avatar', public._rsv_avatar(x.clerk_user_id)
    ) ORDER BY x.starts DESC, x.alias ASC), '[]'::json)
    INTO result
    FROM (
        SELECT cp.clerk_user_id, cp.alias,
               lower(translate(cp.alias, 'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòù', 'AEIOUUNaeiouunAEIOUaeiou'))
                   LIKE q || '%' AS starts
        FROM community_profiles cp
        WHERE cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
          AND cp.clerk_user_id <> p_clerk_user_id
          AND lower(translate(cp.alias, 'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòù', 'AEIOUUNaeiouunAEIOUaeiou'))
                  LIKE '%' || q || '%'
          AND NOT public._community_blocked(p_clerk_user_id, cp.clerk_user_id)
          AND NOT public._community_banned(cp.clerk_user_id)
        ORDER BY 3 DESC, cp.alias ASC
        LIMIT 20
    ) x;
    RETURN result;
END $$;

-- =====================================================================
-- 7) NOTAS COMPARTIDAS
-- =====================================================================

-- La nota tal como la ve UNA persona: su carpeta, anclado y favorito, quién
-- más la tiene y quién la editó por última vez.
CREATE OR REPLACE FUNCTION public._nota_json_for(n public.bitacora_notas, p_me text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    mem     bitacora_nota_members%ROWTYPE;
    v_owner boolean := (n.clerk_user_id = p_me);
    v_parts json;
    v_count int;
BEGIN
    IF NOT v_owner THEN
        SELECT * INTO mem FROM bitacora_nota_members
        WHERE nota_id = n.id AND clerk_user_id = p_me;
    END IF;
    SELECT COUNT(*) INTO v_count FROM bitacora_nota_members WHERE nota_id = n.id;
    IF v_count > 0 THEN
        SELECT json_agg(p ORDER BY (p->>'is_owner')::boolean DESC, p->>'alias')
        INTO v_parts
        FROM (
            SELECT json_build_object(
                'id', n.clerk_user_id,
                'alias', public._rsv_alias(n.clerk_user_id),
                'avatar', public._rsv_avatar(n.clerk_user_id),
                'is_owner', true,
                'is_me', n.clerk_user_id = p_me
            ) AS p
            UNION ALL
            SELECT json_build_object(
                'id', m.clerk_user_id,
                'alias', public._rsv_alias(m.clerk_user_id),
                'avatar', public._rsv_avatar(m.clerk_user_id),
                'is_owner', false,
                'is_me', m.clerk_user_id = p_me
            )
            FROM bitacora_nota_members m WHERE m.nota_id = n.id
        ) s;
    END IF;

    RETURN json_build_object(
        'id',          n.id,
        'title',       public._priv_decrypt(n.title, n.enc),
        'body',        public._priv_decrypt(n.body,  n.enc),
        'tag',         CASE WHEN v_owner THEN n.tag ELSE COALESCE(mem.tag, '') END,
        'pinned',      CASE WHEN v_owner THEN n.pinned ELSE COALESCE(mem.pinned, false) END,
        'favorite',    CASE WHEN v_owner THEN n.favorite ELSE COALESCE(mem.favorite, false) END,
        'created_at',  n.created_at,
        'updated_at',  n.updated_at,
        'version',     n.version,
        'is_owner',    v_owner,
        'owner_alias', CASE WHEN v_owner THEN NULL ELSE public._rsv_alias(n.clerk_user_id) END,
        'shared',      v_count > 0,
        'members',     COALESCE(v_parts, '[]'::json),
        'last_editor_alias', CASE
            WHEN n.last_editor_id IS NOT NULL AND n.last_editor_id <> p_me
            THEN public._rsv_alias(n.last_editor_id) END
    );
END $$;

-- get_my_notas gana p_with_shared. Sin él (la app publicada) devuelve
-- exactamente lo de antes; con él suma las notas que te compartieron y las
-- invitaciones pendientes.
DROP FUNCTION IF EXISTS public.get_my_notas(text);
CREATE OR REPLACE FUNCTION public.get_my_notas(
    p_clerk_user_id text,
    p_with_shared   boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_member boolean;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    v_member := public._is_active_member(p_clerk_user_id);

    IF NOT COALESCE(p_with_shared, false) THEN
        RETURN json_build_object(
            'is_member',  v_member,
            'free_limit', 5,
            'max_total',  1000,
            'notas', COALESCE((
                SELECT json_agg(public._nota_to_json(n)
                                ORDER BY n.pinned DESC, n.updated_at DESC)
                FROM public.bitacora_notas n
                WHERE n.clerk_user_id = p_clerk_user_id
            ), '[]'::json)
        );
    END IF;

    RETURN json_build_object(
        'is_member',  v_member,
        'free_limit', 5,
        'max_total',  1000,
        'owned_count', (SELECT COUNT(*) FROM bitacora_notas WHERE clerk_user_id = p_clerk_user_id),
        'notas', COALESCE((
            SELECT json_agg(public._nota_json_for(n, p_clerk_user_id) ORDER BY n.updated_at DESC)
            FROM public.bitacora_notas n
            WHERE n.clerk_user_id = p_clerk_user_id
               OR EXISTS (SELECT 1 FROM bitacora_nota_members m
                          WHERE m.nota_id = n.id AND m.clerk_user_id = p_clerk_user_id)
        ), '[]'::json),
        'invites', COALESCE((
            SELECT json_agg(json_build_object(
                'invite_id',      i.id,
                'nota_id',        i.nota_id,
                'title',          public._priv_decrypt(n.title, n.enc),
                'inviter_alias',  public._rsv_alias(i.inviter_id),
                'inviter_avatar', public._rsv_avatar(i.inviter_id),
                'created_at',     i.created_at
            ) ORDER BY i.created_at DESC)
            FROM bitacora_nota_invites i
            JOIN bitacora_notas n ON n.id = i.nota_id
            WHERE i.invitee_id = p_clerk_user_id
              AND i.status = 'pendiente'
              AND NOT public._community_blocked(p_clerk_user_id, i.inviter_id)
        ), '[]'::json)
    );
END $$;

-- upsert_nota gana p_base_version: si la app lo manda y alguien más ya guardó
-- una versión nueva del contenido, NO se pisa: se devuelve la nota vigente
-- para que la app funda los dos cambios. Sin él, todo igual que antes.
DROP FUNCTION IF EXISTS public.upsert_nota(text, uuid, text, text, text, boolean, boolean);
CREATE OR REPLACE FUNCTION public.upsert_nota(
    p_clerk_user_id text,
    p_id            uuid,
    p_title         text,
    p_body          text,
    p_tag           text,
    p_pinned        boolean DEFAULT false,
    p_favorite      boolean DEFAULT false,
    p_base_version  integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    me         text    := p_clerk_user_id;
    v_title    text    := left(COALESCE(p_title, ''), 200);
    v_body     text    := left(COALESCE(p_body, ''), 20000);
    v_tag      text    := left(COALESCE(TRIM(p_tag), ''), 40);
    v_count    int;
    v_member   boolean;
    v_row      public.bitacora_notas;
    v_owner    boolean := false;
    v_collab   boolean := false;
    v_changed  boolean;
BEGIN
    IF me IS NULL OR length(trim(me)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_id IS NOT NULL THEN
        SELECT * INTO v_row FROM public.bitacora_notas WHERE id = p_id FOR UPDATE;
        IF FOUND THEN
            v_owner  := (v_row.clerk_user_id = me);
            v_collab := EXISTS (SELECT 1 FROM bitacora_nota_members
                                WHERE nota_id = p_id AND clerk_user_id = me);
        END IF;
    END IF;

    IF v_owner OR v_collab THEN
        v_changed := v_title IS DISTINCT FROM public._priv_decrypt(v_row.title, v_row.enc)
                  OR v_body  IS DISTINCT FROM public._priv_decrypt(v_row.body,  v_row.enc);

        IF v_changed AND p_base_version IS NOT NULL AND p_base_version <> v_row.version THEN
            RETURN json_build_object(
                'ok', false, 'conflict', true,
                'nota', public._nota_json_for(v_row, me)
            );
        END IF;

        IF v_changed THEN
            UPDATE public.bitacora_notas SET
                title          = v_title,
                body           = v_body,
                version        = version + 1,
                last_editor_id = me,
                updated_at     = now(),
                tag      = CASE WHEN v_owner THEN v_tag ELSE tag END,
                pinned   = CASE WHEN v_owner THEN COALESCE(p_pinned, false) ELSE pinned END,
                favorite = CASE WHEN v_owner THEN COALESCE(p_favorite, false) ELSE favorite END
            WHERE id = p_id
            RETURNING * INTO v_row;
        ELSIF v_owner THEN
            UPDATE public.bitacora_notas SET
                tag      = v_tag,
                pinned   = COALESCE(p_pinned, false),
                favorite = COALESCE(p_favorite, false)
            WHERE id = p_id
            RETURNING * INTO v_row;
        END IF;

        IF v_collab THEN
            UPDATE bitacora_nota_members SET
                tag      = v_tag,
                pinned   = COALESCE(p_pinned, false),
                favorite = COALESCE(p_favorite, false)
            WHERE nota_id = p_id AND clerk_user_id = me;
        END IF;

        RETURN json_build_object('ok', true, 'nota', public._nota_json_for(v_row, me),
            'member_ids', COALESCE((
                SELECT json_agg(x.id) FROM (
                    SELECT v_row.clerk_user_id AS id
                    UNION SELECT clerk_user_id FROM bitacora_nota_members WHERE nota_id = p_id
                ) x WHERE x.id <> me
            ), '[]'::json));
    END IF;

    -- Nota NUEVA (o una que ya no es tuya: se guarda como tuya, nada se pierde).
    SELECT count(*)::int INTO v_count FROM public.bitacora_notas WHERE clerk_user_id = me;
    v_member := public._is_active_member(me);
    IF NOT v_member AND v_count >= 5 THEN
        RETURN json_build_object('error', 'limit_free');
    END IF;
    IF v_count >= 1000 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    INSERT INTO public.bitacora_notas (clerk_user_id, title, body, tag, pinned, favorite, last_editor_id)
    VALUES (me, v_title, v_body, v_tag, COALESCE(p_pinned, false), COALESCE(p_favorite, false), me)
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'nota',
        CASE WHEN p_base_version IS NULL THEN public._nota_to_json(v_row)
             ELSE public._nota_json_for(v_row, me) END);
END $$;

-- Borrar: quien la creó la borra para todos; quien la recibió solo sale de ella.
CREATE OR REPLACE FUNCTION public.delete_nota(p_clerk_user_id text, p_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ids json;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF EXISTS (SELECT 1 FROM bitacora_notas WHERE id = p_id AND clerk_user_id = p_clerk_user_id) THEN
        SELECT COALESCE(json_agg(clerk_user_id), '[]'::json) INTO v_ids
        FROM bitacora_nota_members WHERE nota_id = p_id;
        DELETE FROM public.bitacora_notas WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
        RETURN json_build_object('ok', true, 'deleted', true, 'member_ids', v_ids);
    END IF;
    DELETE FROM bitacora_nota_members WHERE nota_id = p_id AND clerk_user_id = p_clerk_user_id;
    IF FOUND THEN
        RETURN json_build_object('ok', true, 'deleted', false, 'left', true);
    END IF;
    RETURN json_build_object('ok', true, 'deleted', false);
END $$;

CREATE OR REPLACE FUNCTION public.bitacora_get_nota(p_clerk_user_id text, p_nota_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_row public.bitacora_notas;
BEGIN
    SELECT * INTO v_row FROM bitacora_notas WHERE id = p_nota_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF v_row.clerk_user_id <> p_clerk_user_id AND NOT EXISTS (
        SELECT 1 FROM bitacora_nota_members WHERE nota_id = p_nota_id AND clerk_user_id = p_clerk_user_id
    ) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'nota', public._nota_json_for(v_row, p_clerk_user_id));
END $$;

CREATE OR REPLACE FUNCTION public.bitacora_invite(
    p_clerk_user_id   text,
    p_nota_id         uuid,
    p_target_clerk_id text DEFAULT NULL,
    p_email           text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    me      text := p_clerk_user_id;
    v_row   public.bitacora_notas;
    v_t     json;
    v_id    text;
    v_count int;
    v_iid   bigint;
    v_lang  text;
    v_alias text;
    v_title text;
BEGIN
    SELECT * INTO v_row FROM bitacora_notas WHERE id = p_nota_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF v_row.clerk_user_id <> me THEN RETURN json_build_object('error', 'not_owner'); END IF;

    v_t := public._rsv_invite_target(me, p_target_clerk_id, p_email);
    IF (v_t->>'error') IS NOT NULL THEN RETURN v_t; END IF;
    v_id := v_t->>'id';

    IF EXISTS (SELECT 1 FROM bitacora_nota_members WHERE nota_id = p_nota_id AND clerk_user_id = v_id) THEN
        RETURN json_build_object('error', 'already_member', 'alias', public._rsv_alias(v_id));
    END IF;
    IF EXISTS (SELECT 1 FROM bitacora_nota_invites
               WHERE nota_id = p_nota_id AND invitee_id = v_id AND status = 'pendiente') THEN
        RETURN json_build_object('ok', true, 'already_invited', true, 'alias', public._rsv_alias(v_id));
    END IF;

    SELECT 1 + (SELECT COUNT(*) FROM bitacora_nota_members WHERE nota_id = p_nota_id)
             + (SELECT COUNT(*) FROM bitacora_nota_invites WHERE nota_id = p_nota_id AND status = 'pendiente')
      INTO v_count;
    IF v_count >= 10 THEN RETURN json_build_object('error', 'nota_full'); END IF;

    INSERT INTO bitacora_nota_invites (nota_id, inviter_id, invitee_id)
    VALUES (p_nota_id, me, v_id)
    RETURNING id INTO v_iid;

    v_lang  := public._push_lang(v_id);
    v_alias := NULLIF(public._rsv_alias(me), '');
    v_title := NULLIF(left(TRIM(COALESCE(public._priv_decrypt(v_row.title, v_row.enc), '')), 60), '');
    PERFORM public._push_dispatch(
        v_id,
        CASE WHEN v_lang = 'en' THEN 'Shared note' ELSE 'Nota compartida' END,
        CASE WHEN v_lang = 'en'
            THEN COALESCE(v_alias, 'A Crew Member') || ' wants to share '
                 || COALESCE('“' || v_title || '”', 'a note') || ' with you'
            ELSE COALESCE(v_alias, 'Un Tripulante') || ' quiere compartir contigo '
                 || COALESCE('«' || v_title || '»', 'una nota')
        END,
        jsonb_build_object('type', 'nota_invite', 'invite_id', v_iid, 'nota_id', p_nota_id),
        NULL
    );

    RETURN json_build_object('ok', true, 'invite_id', v_iid, 'alias', public._rsv_alias(v_id));
END $$;

CREATE OR REPLACE FUNCTION public.bitacora_respond_invite(
    p_clerk_user_id text,
    p_invite_id     bigint,
    p_accept        boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    inv     bitacora_nota_invites%ROWTYPE;
    v_row   public.bitacora_notas;
    v_count int;
    v_lang  text;
    v_alias text;
    v_title text;
BEGIN
    SELECT * INTO inv FROM bitacora_nota_invites
    WHERE id = p_invite_id AND invitee_id = p_clerk_user_id
    FOR UPDATE;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF inv.status <> 'pendiente' THEN
        RETURN json_build_object('error', 'not_pending', 'status', inv.status);
    END IF;

    IF NOT COALESCE(p_accept, false) THEN
        UPDATE bitacora_nota_invites SET status = 'rechazada', responded_at = now() WHERE id = inv.id;
        RETURN json_build_object('ok', true, 'accepted', false);
    END IF;

    IF public._community_blocked(p_clerk_user_id, inv.inviter_id) THEN
        UPDATE bitacora_nota_invites SET status = 'cancelada', responded_at = now() WHERE id = inv.id;
        RETURN json_build_object('error', 'unavailable');
    END IF;

    SELECT * INTO v_row FROM bitacora_notas WHERE id = inv.nota_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    SELECT 1 + COUNT(*) INTO v_count FROM bitacora_nota_members WHERE nota_id = inv.nota_id;
    IF v_count >= 10 THEN RETURN json_build_object('error', 'nota_full'); END IF;

    INSERT INTO bitacora_nota_members (nota_id, clerk_user_id, added_by)
    VALUES (inv.nota_id, p_clerk_user_id, inv.inviter_id)
    ON CONFLICT (nota_id, clerk_user_id) DO NOTHING;
    UPDATE bitacora_nota_invites SET status = 'aceptada', responded_at = now() WHERE id = inv.id;

    -- Aviso a quien invitó: ya la tienen los dos.
    v_lang  := public._push_lang(inv.inviter_id);
    v_alias := NULLIF(public._rsv_alias(p_clerk_user_id), '');
    v_title := NULLIF(left(TRIM(COALESCE(public._priv_decrypt(v_row.title, v_row.enc), '')), 60), '');
    PERFORM public._push_dispatch(
        inv.inviter_id,
        CASE WHEN v_lang = 'en' THEN 'Shared note' ELSE 'Nota compartida' END,
        CASE WHEN v_lang = 'en'
            THEN COALESCE(v_alias, 'A Crew Member') || ' accepted '
                 || COALESCE('“' || v_title || '”', 'your note')
            ELSE COALESCE(v_alias, 'Un Tripulante') || ' aceptó '
                 || COALESCE('«' || v_title || '»', 'tu nota')
        END,
        jsonb_build_object('type', 'nota', 'nota_id', inv.nota_id),
        NULL
    );

    RETURN json_build_object('ok', true, 'accepted', true,
        'nota', public._nota_json_for(v_row, p_clerk_user_id));
END $$;

CREATE OR REPLACE FUNCTION public.bitacora_get_sharing(p_clerk_user_id text, p_nota_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row   public.bitacora_notas;
    v_owner boolean;
BEGIN
    SELECT * INTO v_row FROM bitacora_notas WHERE id = p_nota_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    v_owner := v_row.clerk_user_id = p_clerk_user_id;
    IF NOT v_owner AND NOT EXISTS (
        SELECT 1 FROM bitacora_nota_members WHERE nota_id = p_nota_id AND clerk_user_id = p_clerk_user_id
    ) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN json_build_object(
        'ok', true,
        'is_owner', v_owner,
        'owner', json_build_object(
            'id', v_row.clerk_user_id,
            'alias', public._rsv_alias(v_row.clerk_user_id),
            'avatar', public._rsv_avatar(v_row.clerk_user_id),
            'is_me', v_owner
        ),
        'members', COALESCE((
            SELECT json_agg(json_build_object(
                'id', m.clerk_user_id,
                'alias', public._rsv_alias(m.clerk_user_id),
                'avatar', public._rsv_avatar(m.clerk_user_id),
                'is_me', m.clerk_user_id = p_clerk_user_id,
                'added_at', m.added_at
            ) ORDER BY m.added_at ASC)
            FROM bitacora_nota_members m WHERE m.nota_id = p_nota_id
        ), '[]'::json),
        'invites', CASE WHEN v_owner THEN COALESCE((
            SELECT json_agg(json_build_object(
                'invite_id', i.id,
                'alias', public._rsv_alias(i.invitee_id),
                'avatar', public._rsv_avatar(i.invitee_id),
                'created_at', i.created_at
            ) ORDER BY i.created_at DESC)
            FROM bitacora_nota_invites i
            WHERE i.nota_id = p_nota_id AND i.status = 'pendiente'
        ), '[]'::json) ELSE '[]'::json END
    );
END $$;

CREATE OR REPLACE FUNCTION public.bitacora_remove_member(
    p_clerk_user_id   text,
    p_nota_id         uuid,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM bitacora_notas WHERE id = p_nota_id AND clerk_user_id = p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_owner');
    END IF;
    DELETE FROM bitacora_nota_members WHERE nota_id = p_nota_id AND clerk_user_id = p_target_clerk_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'not_member'); END IF;
    RETURN json_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.bitacora_cancel_invite(p_clerk_user_id text, p_invite_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inv bitacora_nota_invites%ROWTYPE;
BEGIN
    SELECT * INTO inv FROM bitacora_nota_invites WHERE id = p_invite_id;
    IF NOT FOUND OR inv.status <> 'pendiente' THEN RETURN json_build_object('error', 'not_found'); END IF;
    IF inv.inviter_id <> p_clerk_user_id AND NOT EXISTS (
        SELECT 1 FROM bitacora_notas WHERE id = inv.nota_id AND clerk_user_id = p_clerk_user_id
    ) THEN
        RETURN json_build_object('error', 'not_owner');
    END IF;
    UPDATE bitacora_nota_invites SET status = 'cancelada', responded_at = now() WHERE id = inv.id;
    RETURN json_build_object('ok', true);
END $$;

-- =====================================================================
-- 7b) LA FICHA DE UN TRIPULANTE OCULTO se revela también a quien comparte
--     un grupo o una nota con él (antes: solo a quien tenía conversación).
--     Cuerpo vivo de la base, cambia UNA condición.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_community_profile(p_clerk_user_id text, p_target_clerk_id text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    tgt text := COALESCE(p_target_clerk_id, '');
    v_alias text; v_bio text; v_avatar text; v_equipped jsonb; v_mastery int;
    v_bd date; v_pref text;
    v_show boolean; v_photo text;
    v_scan json;
    v_streak int := 0; v_dias int := 0; v_rituales int := 0; v_etapa int := 1;
    v_th jsonb;
    v_medals json;
    result json;
BEGIN
    -- Mirarte a ti mismo nunca pasa por los guards de bloqueo/baneo.
    IF tgt <> p_clerk_user_id
       AND (public._community_blocked(p_clerk_user_id, tgt) OR public._community_banned(tgt)) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT
        cp.alias, cp.bio, cp.birthdate, cp.relationship_pref,
        cp.show_photo, cp.photo_url,
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_bd, v_pref, v_show, v_photo, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
      AND (
        cp.visible
        -- ESPEJO (nuevo): siempre puedes ver TU PROPIA tarjeta, estes visible o
        -- no. Es tu reflejo -- justamente sirve mas cuando aun no te muestras,
        -- para decidir con que cara entrarias a la Constelacion.
        OR tgt = p_clerk_user_id
        -- Modelo 1 (reveal por contacto): un Tripulante OCULTO se revela SOLO
        -- a quien ya tiene una conversacion con el. Si existe un hilo entre el
        -- viewer (p_clerk_user_id) y el target (tgt), el viewer puede ver su
        -- tarjeta aunque el target este oculto. El directorio publico sigue
        -- mostrando solo a los visibles; esto solo abre el card en el chat.
        -- 2026-09-21: también a quien comparte un GRUPO o una NOTA contigo
        -- (_rsv_is_contact cubre conversación, grupo y nota).
        OR public._rsv_is_contact(p_clerk_user_id, tgt)
      );

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT json_build_object(
        'indice', sv.indice_silicio, 'fisico', sv.hardware_fisico,
        'mental', sv.procesador_mental, 'emocional', sv.motor_emocional,
        'financiero', sv.gravedad_financiera, 'vector', sv.vector_expansion,
        'orbita', sv.orbita_relacional, 'scanned_at', sv.created_at
    ) INTO v_scan
    FROM scan_vibracional sv
    WHERE sv.clerk_user_id = tgt
      AND sv.cycle_scanned_json LIKE '%"fisico"%'
      AND sv.cycle_scanned_json LIKE '%"mental"%'
      AND sv.cycle_scanned_json LIKE '%"emocional"%'
      AND sv.cycle_scanned_json LIKE '%"financiero"%'
      AND sv.cycle_scanned_json LIKE '%"vector"%'
      AND sv.cycle_scanned_json LIKE '%"orbita"%'
    ORDER BY sv.created_at DESC
    LIMIT 1;

    BEGIN
        SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
        FROM daily_checkins WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01';

        SELECT COUNT(*)::int INTO v_rituales
        FROM daily_checkins WHERE clerk_user_id = tgt AND activity_key <> 'admin_adjust';

        WITH d AS (
            SELECT DISTINCT checkin_date AS cd FROM daily_checkins
            WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01' AND checkin_date <= d_today
        ),
        g AS (SELECT cd, (cd - (ROW_NUMBER() OVER (ORDER BY cd))::int) AS grp FROM d)
        SELECT CASE
            WHEN (SELECT MAX(cd) FROM d) IS NULL OR (SELECT MAX(cd) FROM d) < d_today - 1 THEN 0
            ELSE (SELECT COUNT(*) FROM g WHERE grp = (SELECT grp FROM g ORDER BY cd DESC LIMIT 1))::int
        END INTO v_streak;
        v_streak := COALESCE(v_streak, 0);

        SELECT thresholds INTO v_th FROM avatar_config WHERE avatar_key = v_avatar;
        v_th := COALESCE(v_th, '[0,50,250,800,2000,5000,12000]'::jsonb);
        SELECT GREATEST(COUNT(*), 1)::int INTO v_etapa
        FROM jsonb_array_elements_text(v_th) t WHERE v_mastery >= (t::numeric);
    EXCEPTION WHEN OTHERS THEN
        v_streak := 0; v_dias := 0; v_rituales := 0; v_etapa := 1;
    END;

    SELECT COALESCE(json_agg(json_build_object(
        'key', mc.constelacion_key, 'label', mc.label, 'glyph', mc.glyph_key,
        'accent', mc.accent,
        'total', (SELECT COUNT(*) FROM medal_tiers mt WHERE mt.constelacion_key = mc.constelacion_key),
        'unlocked', (
            SELECT COUNT(*) FROM medal_tiers mt
            WHERE mt.constelacion_key = mc.constelacion_key
              AND (CASE mc.metric
                    WHEN 'fotones'      THEN v_mastery
                    WHEN 'racha'        THEN v_streak
                    WHEN 'dias_activos' THEN v_dias
                    WHEN 'rituales'     THEN v_rituales
                    WHEN 'etapa'        THEN v_etapa
                    ELSE 0 END) >= mt.threshold
        )
    ) ORDER BY mc.sort_order, mc.label), '[]'::json)
    INTO v_medals
    FROM medal_constelaciones mc WHERE mc.active;

    SELECT json_build_object(
        'clerk_user_id', tgt, 'alias', v_alias, 'bio', v_bio,
        'avatar_key', v_avatar, 'equipped', v_equipped, 'mastery', v_mastery,
        'relationship_pref', v_pref,
        'photo', CASE WHEN COALESCE(v_show, false) AND v_photo IS NOT NULL THEN v_photo ELSE NULL END,
        'age', CASE WHEN v_bd IS NULL THEN NULL ELSE date_part('year', age(v_bd))::int END,
        'scan', v_scan,
        'medals', v_medals,
        'interests', COALESCE((
            SELECT json_agg(json_build_object('key', ci.interest_key, 'label', ci.label)
                            ORDER BY ci.sort_order, ci.label)
            FROM community_profile_interests pi
            JOIN community_interests ci ON ci.interest_key = pi.interest_key
            WHERE pi.clerk_user_id = tgt
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label, 'params', params
            ) ORDER BY kind, sort_order, label)
            FROM crystal_catalog WHERE active
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$function$
;

-- =====================================================================
-- 8) EL LATIDO DEL HOGAR CUENTA TAMBIÉN LOS GRUPOS
-- =====================================================================
-- Mismo cuerpo de siempre; solo el bloque de no leídos pasa a
-- _rsv_unread_total (mensajes privados + grupos no silenciados).
CREATE OR REPLACE FUNCTION public.get_home_state(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today    date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_email    text;
    v_mem      json := NULL;
    v_total    int := 0;
    v_today    int := 0;
    v_streak   int := 0;
    v_med_unl  int := 0;
    v_med_tot  int := 0;
    v_unread   int := 0;
BEGIN
    SELECT email INTO v_email FROM profiles WHERE clerk_user_id = p_clerk_user_id;

    BEGIN
        v_mem := public.get_my_membership(COALESCE(v_email, ''));
    EXCEPTION WHEN OTHERS THEN
        v_mem := NULL;
    END;

    BEGIN
        SELECT COALESCE(SUM(points), 0)::int INTO v_total
        FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id;

        SELECT COALESCE(SUM(points), 0)::int INTO v_today
        FROM daily_checkins
        WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d_today;

        WITH d AS (
            SELECT DISTINCT checkin_date AS cd
            FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id
              AND checkin_date <> DATE '2000-01-01'
              AND checkin_date <= d_today
        ),
        g AS (
            SELECT cd, (cd - (ROW_NUMBER() OVER (ORDER BY cd))::int) AS grp FROM d
        )
        SELECT CASE
            WHEN (SELECT MAX(cd) FROM d) IS NULL OR (SELECT MAX(cd) FROM d) < d_today - 1 THEN 0
            ELSE (SELECT COUNT(*) FROM g WHERE grp = (SELECT grp FROM g ORDER BY cd DESC LIMIT 1))::int
        END INTO v_streak;
        v_streak := COALESCE(v_streak, 0);
    EXCEPTION WHEN OTHERS THEN
        v_total := 0; v_today := 0; v_streak := 0;
    END;

    BEGIN
        SELECT COUNT(*)::int INTO v_med_unl
        FROM medal_unlocks WHERE clerk_user_id = p_clerk_user_id;

        SELECT COUNT(*)::int INTO v_med_tot
        FROM medal_tiers mt
        JOIN medal_constelaciones mc
          ON mc.constelacion_key = mt.constelacion_key AND mc.active;
    EXCEPTION WHEN OTHERS THEN
        v_med_unl := 0; v_med_tot := 0;
    END;

    v_unread := public._rsv_unread_total(p_clerk_user_id);

    RETURN json_build_object(
        'membership', v_mem,
        'ritual', json_build_object(
            'total_fotones', v_total,
            'today_fotones', v_today,
            'streak', v_streak
        ),
        'medals', json_build_object('unlocked', v_med_unl, 'total', v_med_tot),
        'unread', v_unread
    );
END $$;

-- =====================================================================
-- 9) BORRADO DE CUENTA: también grupos, notas compartidas e invitaciones
-- =====================================================================
CREATE OR REPLACE FUNCTION public.purge_my_account_data(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tables text[] := ARRAY[
        -- lo que ya borraba la edge
        'scan_vibracional','sonda_progress','decoder_scans',
        'estado_tripulante_protocolos','cristales_extraccion','meditaciones_owned',
        'reading_progress','navegante_progress','email_dispatches',
        -- lo íntimo que quedaba fuera
        'bitacora_notas','rachas','dream_records','dream_scans',
        'oraculo_messages','oraculo_conversations','oraculo_usage',
        'espejo_memoria','espejo_context_prefs',
        'vision_board','vision_answers','vision_photos','vision_versions',
        'vision_sessions','matter_jobs','crop_decodes',
        -- ritual, plan de vuelo y progreso
        'daily_checkins','daily_ritual_config','ritual_personalizado',
        'ritual_user_afirmaciones_custom','ritual_user_afirmaciones_sel',
        'day_tasks','medal_unlocks','user_crystal_owned','user_crystal_state',
        'ciudad_luz_estado',
        -- comunidad e identidad pública
        'community_profiles','community_profile_interests',
        -- grupos y notas compartidas (2026-09-21)
        'bitacora_nota_members','grp_hearts',
        -- avisos, telemetría y preferencias
        'push_tokens','notif_prefs','radar_ready_notified','nav_events',
        'wallpaper_downloads','voice_transcript_usage','app_feedback',
        'gift_offers','analisis_profundo'
    ];
    v_t       text;
    v_n       int;
    v_gid     bigint;
    v_deleted json[] := '{}';
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    FOREACH v_t IN ARRAY v_tables LOOP
        BEGIN
            IF to_regclass('public.' || quote_ident(v_t)) IS NULL THEN
                CONTINUE;
            END IF;
            EXECUTE format(
                'DELETE FROM public.%I WHERE clerk_user_id = $1', v_t
            ) USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', v_t, 'n', v_n);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_deleted := v_deleted || json_build_object('t', v_t, 'err', SQLERRM);
        END;
    END LOOP;

    BEGIN
        IF to_regclass('public.dm_messages') IS NOT NULL THEN
            EXECUTE 'DELETE FROM public.dm_messages WHERE sender_clerk_id = $1'
                USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'err', SQLERRM);
    END;

    -- Grupos: sus mensajes se van, su lugar se libera y el grupo sigue con
    -- los demás (si se queda sin administrador, lo es el más antiguo; si se
    -- queda sin nadie, desaparece).
    BEGIN
        IF to_regclass('public.grp_members') IS NOT NULL THEN
            DELETE FROM public.grp_messages WHERE sender_clerk_id = p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            DELETE FROM public.grp_invites
            WHERE inviter_id = p_clerk_user_id OR invitee_id = p_clerk_user_id;
            FOR v_gid IN
                SELECT group_id FROM public.grp_members WHERE clerk_user_id = p_clerk_user_id
            LOOP
                DELETE FROM public.grp_members
                WHERE group_id = v_gid AND clerk_user_id = p_clerk_user_id;
                PERFORM public._grp_fix_admins(v_gid);
            END LOOP;
            v_deleted := v_deleted || json_build_object('t', 'grupos', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'grupos', 'err', SQLERRM);
    END;

    BEGIN
        IF to_regclass('public.bitacora_nota_invites') IS NOT NULL THEN
            DELETE FROM public.bitacora_nota_invites
            WHERE inviter_id = p_clerk_user_id OR invitee_id = p_clerk_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'bitacora_nota_invites', 'err', SQLERRM);
    END;

    RETURN json_build_object('ok', true, 'total', v_total, 'detail', array_to_json(v_deleted));
END $$;

-- =====================================================================
-- 10) PERMISOS: nada público; solo service_role (el gateway)
-- =====================================================================
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure::text AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
            '_push_lang', '_rsv_alias', '_rsv_avatar', '_rsv_is_contact',
            '_rsv_invite_target', '_msg_push_preview', '_rsv_unread_total',
            '_dm_notify_recipient',
            '_grp_system', '_grp_is_member', '_grp_is_admin', '_grp_fix_admins',
            '_grp_invite_one', '_grp_media_guard_tg', '_grp_notify_members',
            'grp_create', 'grp_invite', 'grp_get_my_invites', 'grp_respond_invite',
            'grp_cancel_invite', 'grp_get_my_groups', 'grp_get_info', 'grp_get_messages',
            'grp_send_message', 'grp_mark_read', 'grp_react_message', 'grp_update',
            'grp_set_role', 'grp_remove_member', 'grp_leave', 'grp_set_mute', 'grp_delete',
            'grp_transcribe_voice_check', 'grp_set_voice_transcript',
            'rsv_get_my_contacts', 'rsv_search_tripulantes',
            '_nota_json_for', 'get_my_notas', 'upsert_nota', 'delete_nota',
            'bitacora_get_nota', 'bitacora_invite', 'bitacora_respond_invite',
            'bitacora_get_sharing', 'bitacora_remove_member', 'bitacora_cancel_invite',
            'get_home_state', 'purge_my_account_data', 'get_community_profile'
          )
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    END LOOP;
END $$;
