-- Red Solar Viva · EL NÚMERO DEL ÍCONO CUENTA TODO LO QUE TE ESPERA (2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run. Idempotente.
-- Requiere 20261018b_soporte_cerrar.sql (ya pegada).
--
-- 🜂 POR QUÉ. Zak: «hay que poner un número en el ícono… así es super notorio».
-- El número del ícono de la app (aps.badge) solo contaba mensajes directos y de
-- grupos. Ahora es UN solo total: mensajes sin leer + respuestas de soporte sin
-- leer + 1 si hay un regalo de Sintonía pendiente. Lo mandan los cuatro avisos
-- que llevan número: mensaje directo, mensaje de grupo, respuesta de soporte y
-- regalo. La app pone el mismo total al abrirse, así que abrirla no lo borra.
--
--   · _rsv_icon_total(uid)  — el total del ícono (nueva).
--   · _rsv_unread_total     — NO se toca: get_home_state la usa para el número
--                             de mensajes sobre el Radar.
--   · _dm_notify_recipient, _grp_notify_members, admin_offer_gift_sintonia y
--     admin_soporte_mensaje — copiadas de producción el 2026-10-18; solo cambia
--     el número que mandan.
--
-- iOS solo pinta el número a quien aceptó las notificaciones.

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1) _rsv_icon_total · mensajes + soporte + regalo
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._rsv_icon_total(p_clerk_user_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chat    int := 0;
    v_soporte int := 0;
    v_regalo  int := 0;
BEGIN
    IF p_clerk_user_id IS NULL THEN RETURN 0; END IF;
    BEGIN
        v_chat := COALESCE(public._rsv_unread_total(p_clerk_user_id), 0);
    EXCEPTION WHEN OTHERS THEN v_chat := 0;
    END;
    BEGIN
        SELECT count(*)::int INTO v_soporte
        FROM support_messages m
        JOIN support_tickets t ON t.id = m.ticket_id
        WHERE t.clerk_user_id = p_clerk_user_id
          AND t.status <> 'cerrado'
          AND m.autor = 'casa'
          AND m.read_at IS NULL;
    EXCEPTION WHEN OTHERS THEN v_soporte := 0;
    END;
    BEGIN
        SELECT CASE WHEN EXISTS (
            SELECT 1 FROM gift_offers
            WHERE clerk_user_id = p_clerk_user_id AND claimed_at IS NULL
        ) THEN 1 ELSE 0 END INTO v_regalo;
    EXCEPTION WHEN OTHERS THEN v_regalo := 0;
    END;
    RETURN v_chat + v_soporte + v_regalo;
END;
$$;
REVOKE EXECUTE ON FUNCTION public._rsv_icon_total(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._rsv_icon_total(text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 2) Mensaje directo (disparador) · el número es el total del ícono
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._dm_notify_recipient()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
    v_badge := public._rsv_icon_total(v_recipient);

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
END $function$;

-- ════════════════════════════════════════════════════════════════════
-- 3) Mensaje de grupo (disparador) · el número es el total del ícono
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._grp_notify_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
            v_badge := public._rsv_icon_total(r.clerk_user_id);
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
END $function$;

-- ════════════════════════════════════════════════════════════════════
-- 4) Regalo de Sintonía · ahora lleva número
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_offer_gift_sintonia(p_admin_clerk_id text, p_target_clerk_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_existing uuid;
    v_new_id   uuid;
    v_lang     text := 'es';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_target_clerk_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tripulante no encontrado');
    END IF;

    -- Idempotente: si ya hay un regalo pendiente, no duplicar NI volver a
    -- avisar (insistir con la misma persona se siente acoso, no regalo).
    SELECT id INTO v_existing
    FROM gift_offers
    WHERE clerk_user_id = p_target_clerk_id AND claimed_at IS NULL
    LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'gift_id', v_existing, 'already_pending', true);
    END IF;

    v_new_id := gen_random_uuid();
    INSERT INTO gift_offers (id, clerk_user_id, kind, gifted_by)
    VALUES (v_new_id, p_target_clerk_id, 'sintonia_1mes', p_admin_clerk_id);

    /* Idioma del aparato del nodo (push_tokens.lang, que ya llena
       register_push_token desde 20260805): se habla en el idioma de quien
       lee, igual que el aviso del ciclo del Radar. */
    SELECT lower(left(coalesce(nullif(trim(p.lang), ''), 'es'), 2))
      INTO v_lang
      FROM push_tokens p
     WHERE p.clerk_user_id = p_target_clerk_id
     ORDER BY p.updated_at DESC NULLS LAST
     LIMIT 1;
    IF v_lang IS NULL OR v_lang <> 'en' THEN v_lang := 'es'; END IF;

    /* 🜂 El aviso al teléfono. `type: gift` ya lo rutea PushSync → abre la
       celebración directamente, no el Radar. Si el nodo no registró
       notificaciones, _push_dispatch no hace nada y el regalo sigue vivo
       esperándolo dentro de la app. */
    PERFORM public._push_dispatch(
        p_target_clerk_id,
        CASE WHEN v_lang = 'en' THEN 'A gift for you' ELSE 'Un regalo para ti' END,
        CASE WHEN v_lang = 'en'
             THEN 'Zak''Haar sent you a month of Sintonía Solar. Open it here.'
             ELSE 'Zak''Haar te envió un mes de Sintonía Solar. Ábrelo aquí.'
        END,
        jsonb_build_object('type', 'gift', 'gift_id', v_new_id::text),
        /* 2026-10-18 · el número del ícono ya cuenta este regalo. */
        GREATEST(COALESCE(public._rsv_icon_total(p_target_clerk_id), 1), 1)
    );

    RETURN jsonb_build_object('success', true, 'gift_id', v_new_id, 'push', true);
END;
$function$;

-- ════════════════════════════════════════════════════════════════════
-- 5) Respuesta de soporte · lleva número (la reapertura ya vive desde 20261018b)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_soporte_mensaje(p_admin_clerk_id text, p_ticket_id uuid DEFAULT NULL::uuid, p_target_email text DEFAULT NULL::text, p_body text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_plantilla text DEFAULT NULL::text, p_prueba boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_admin   boolean;
    v_ticket  record;
    v_uid     text;
    v_email   text;
    v_lang    text := 'es';
    v_extra   text := NULLIF(TRIM(COALESCE(p_body, '')), '');
    v_base    text := '';
    v_cuerpo  text;
    v_status  text := NULLIF(LOWER(TRIM(COALESCE(p_status, ''))), '');
    v_id      uuid;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    /* ── Encontrar (o abrir) el caso ── */
    IF p_ticket_id IS NOT NULL THEN
        SELECT * INTO v_ticket FROM support_tickets WHERE id = p_ticket_id;
        IF v_ticket.id IS NULL THEN
            RETURN jsonb_build_object('ok', false, 'error', 'caso_no_existe');
        END IF;
        v_uid   := v_ticket.clerk_user_id;
        v_email := v_ticket.email;
        v_lang  := COALESCE(NULLIF(v_ticket.lang, ''), 'es');
    ELSE
        v_email := LOWER(TRIM(COALESCE(p_target_email, '')));
        IF length(v_email) < 3 THEN
            RETURN jsonb_build_object('ok', false, 'error', 'sin_destinatario');
        END IF;
        SELECT clerk_user_id INTO v_uid FROM profiles
        WHERE LOWER(TRIM(email)) = v_email
        ORDER BY (clerk_user_id IS NULL), id
        LIMIT 1;
        IF v_uid IS NULL THEN
            RETURN jsonb_build_object('ok', false, 'error', 'destino_sin_cuenta');
        END IF;

        INSERT INTO support_tickets (
            clerk_user_id, email, kind, message, status
        ) VALUES (
            v_uid, v_email,
            CASE WHEN p_plantilla = 'transferencia' THEN 'acceso_pago' ELSE 'otro' END,
            '', 'en_curso'
        )
        RETURNING * INTO v_ticket;
    END IF;

    /* ── Componer el cuerpo ── */
    IF p_plantilla = 'transferencia' THEN
        v_base := CASE WHEN v_lang = 'en' THEN
            'Your access is now active on this account. We moved the payment you made with a different email over here, so you can come in as normal.'
        ELSE
            'Tu acceso ya quedó activo en esta cuenta. El pago que hiciste con otro correo lo movimos aquí, así que puedes entrar normal.'
        END;
    END IF;

    v_cuerpo := TRIM(BOTH E' \n' FROM
        CASE
            WHEN v_base <> '' AND v_extra IS NOT NULL THEN v_base || E'\n\n' || v_extra
            WHEN v_base <> '' THEN v_base
            ELSE COALESCE(v_extra, '')
        END
    );
    IF v_cuerpo = '' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'mensaje_vacio');
    END IF;
    v_cuerpo := LEFT(v_cuerpo, 4000);

    INSERT INTO support_messages (ticket_id, autor, body, admin_clerk_id)
    VALUES (v_ticket.id, 'casa', v_cuerpo, p_admin_clerk_id)
    RETURNING id INTO v_id;

    /* Una PRUEBA no mueve el estado ni resuelve nada: solo manda el aviso. */
    IF NOT COALESCE(p_prueba, false) THEN
        UPDATE support_tickets
        SET status = COALESCE(
                CASE WHEN v_status IN ('nuevo','en_curso','resuelto','cerrado')
                     THEN v_status END,
                /* 🜂 2026-10-18 · la casa vuelve a escribir en un caso que la
                   persona (o la casa) dio por cerrado o resuelto: SE REABRE.
                   Un caso cerrado no se ve en la app; sin esto el mensaje
                   nuevo quedaba escondido para siempre. */
                CASE WHEN status IN ('nuevo','resuelto','cerrado') THEN 'en_curso'
                     ELSE status END
            ),
            resolved_by = CASE WHEN v_status IN ('resuelto','cerrado')
                                    THEN p_admin_clerk_id
                               WHEN v_status IS NULL AND status IN ('resuelto','cerrado')
                                    THEN NULL
                               ELSE resolved_by END,
            resolved_at = CASE WHEN v_status IN ('resuelto','cerrado')
                                    THEN now()
                               WHEN v_status IS NULL AND status IN ('resuelto','cerrado')
                                    THEN NULL
                               ELSE resolved_at END,
            updated_at = now()
        WHERE id = v_ticket.id;
    END IF;

    INSERT INTO support_actions (ticket_id, admin_clerk_id, action, target_ref, detalle)
    VALUES (v_ticket.id, p_admin_clerk_id, 'responder', v_id::text,
            jsonb_build_object(
                'plantilla', p_plantilla,
                'prueba',    COALESCE(p_prueba, false),
                'status',    v_status,
                'preview',   LEFT(v_cuerpo, 120)
            ));

    /* Push por el mismo camino que los DM. Si el nodo no tiene token, la
       helper simplemente no hace nada. */
    PERFORM public._push_dispatch(
        v_uid,
        CASE WHEN v_lang = 'en' THEN 'Zak''Haar · Support' ELSE 'Zak''Haar · Soporte' END,
        LEFT(v_cuerpo, 140),
        jsonb_build_object('type', 'soporte', 'ticket_id', v_ticket.id::text),
        /* 2026-10-18 · número en el ícono: mensajes + soporte + regalo. */
        GREATEST(COALESCE(public._rsv_icon_total(v_uid), 1), 1)
    );

    RETURN jsonb_build_object(
        'ok', true,
        'ticket_id', v_ticket.id,
        'message_id', v_id,
        'destino', v_email,
        'prueba', COALESCE(p_prueba, false)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
