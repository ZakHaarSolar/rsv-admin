-- Red Solar Viva · SOPORTE QUE SE VE: LA PERSONA CIERRA SU CASO Y LA CASA LO REABRE (2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run. Idempotente.
-- Requiere 20260807c_soporte_conversacion.sql (ya aplicada).
--
-- 🜂 POR QUÉ. La respuesta de la casa solo avisaba por notificación; quien no las
-- aceptó nunca se enteraba (F22 leyó una respuesta 11 días después). Ahora la app
-- pinta un número en Mi Núcleo y en Ajustes con las respuestas sin leer, la tarjeta
-- del caso abierto sube hasta arriba, y la persona puede CERRAR su caso. Lo que
-- esto crea en el servidor:
--   · close_my_support_ticket  — la persona cierra SU caso (nunca uno ajeno).
--     Queda status 'cerrado' con resolved_by = su propio id: así el Motor sabe que
--     lo cerró ella y no la casa. Cerrar dos veces responde ok (la app puede
--     mandarlo de nuevo al volver la red).
--   · admin_soporte_mensaje    — misma firma; si la casa escribe en un caso
--     cerrado o resuelto (sin pedir otro estado), el caso se REABRE a 'en_curso'.
--   · Índice para contar rápido los mensajes de la casa sin leer.
-- El conteo del número sale de get_my_support_tickets (ya trae sin_leer por caso).

BEGIN;

CREATE INDEX IF NOT EXISTS support_messages_casa_sin_leer_idx
    ON public.support_messages (ticket_id)
    WHERE autor = 'casa' AND read_at IS NULL;

-- ════════════════════════════════════════════════════════════════════
-- 1) close_my_support_ticket — la persona cierra su caso.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.close_my_support_ticket(
    p_clerk_user_id text,
    p_ticket_id     uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    text := NULLIF(TRIM(COALESCE(p_clerk_user_id, '')), '');
    v_owner  text;
    v_status text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'sin_sesion');
    END IF;
    SELECT clerk_user_id, status INTO v_owner, v_status
    FROM support_tickets WHERE id = p_ticket_id;
    IF v_owner IS NULL OR v_owner <> v_uid THEN
        RETURN json_build_object('ok', false, 'error', 'no_es_tuyo');
    END IF;
    IF v_status = 'cerrado' THEN
        RETURN json_build_object('ok', true, 'ya_cerrado', true);
    END IF;

    UPDATE support_tickets
    SET status      = 'cerrado',
        resolved_by = v_uid,
        resolved_at = now(),
        updated_at  = now()
    WHERE id = p_ticket_id;

    /* Lo que la casa escribió ya no queda pendiente: quien cierra lo leyó. */
    UPDATE support_messages SET read_at = now()
    WHERE ticket_id = p_ticket_id AND autor = 'casa' AND read_at IS NULL;

    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.close_my_support_ticket(text, uuid)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_my_support_ticket(text, uuid) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 2) admin_soporte_mensaje — igual que en 20260807c, más la reapertura.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_soporte_mensaje(
    p_admin_clerk_id text,
    p_ticket_id      uuid    DEFAULT NULL,
    p_target_email   text    DEFAULT NULL,
    p_body           text    DEFAULT NULL,
    p_status         text    DEFAULT NULL,
    p_plantilla      text    DEFAULT NULL,
    p_prueba         boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        jsonb_build_object('type', 'soporte', 'ticket_id', v_ticket.id::text)
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
$$;
REVOKE EXECUTE ON FUNCTION public.admin_soporte_mensaje(text, uuid, text, text, text, text, boolean)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soporte_mensaje(text, uuid, text, text, text, text, boolean)
    TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
