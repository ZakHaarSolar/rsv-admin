-- Red Solar Viva · SOPORTE SE VUELVE CONVERSACIÓN + BORRADO TOTAL DEL EMBUDO
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere 20260807_soporte.sql ya aplicado.
--
-- 🜂 POR QUÉ EL HILO VIVE EN EL CASO Y NO EN LOS MENSAJES DE COMUNIDAD.
-- El aviso de una transferencia salía como mensaje directo de Zak'Haar y
-- aterrizaba en la misma bandeja donde a la persona le escriben otros
-- Tripulantes. Alguien que reportó un cobro no puede recibir la respuesta
-- entre mensajes sociales: eso no se siente atendido, se siente traspapelado.
-- Ahora cada caso ES su propia conversación, y responderlo desde el Motor pasa
-- por el mismo lugar donde están los datos, los pagos y las herramientas.
-- Un solo camino para todo, en vez de dos sistemas que se parecen.
--
-- LO QUE CREA:
--   · support_messages          — el hilo de cada caso (tripulante ↔ casa).
--   · support_tickets           — dos columnas nuevas: aparato y versión del SO.
--   · admin_soporte_mensaje     — la casa responde. Si no hay caso pero sí un
--                                 correo, ABRE el caso: un solo camino sirve
--                                 para responder, avisar y probar.
--   · get_my_support_tickets    — el Tripulante ve sus casos y su hilo.
--   · add_support_message       — el Tripulante responde (reabre si estaba
--                                 resuelto: nadie se queda sin voz).
--   · mark_support_read         — apaga su punto de no leído.
--   · delete_onb_funnel_all     — borra TODO el embudo del onboarding.

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1) EL EMBUDO SE PUEDE BORRAR ENTERO
--    Hoy solo se podía limpiar hasta 72h atrás. Mientras los únicos que
--    recorren el onboarding somos nosotros, cualquier ventana de 30 o 90 días
--    cuenta testers y no dice nada. Esperar tres meses para tener un número
--    limpio no es una opción: se borra todo y se empieza a contar de cero
--    cuando la puerta se abra de verdad.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.delete_onb_funnel_all(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin   boolean;
    v_deleted int;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    DELETE FROM public.onb_funnel;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN json_build_object('deleted', v_deleted, 'all', true);
END $$;

REVOKE ALL ON FUNCTION public.delete_onb_funnel_all(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_onb_funnel_all(text)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 2) EL REPORTE DICE EN QUÉ APARATO PASÓ
--    No para "cómo lo arreglo en ese teléfono", sino porque hay funciones que
--    SOLO existen en ciertos modelos (el Decodificador de Realidad necesita el
--    sensor de profundidad, que solo traen los Pro). Ver el modelo contesta
--    esos casos sin escribirle a nadie.
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.support_tickets
    ADD COLUMN IF NOT EXISTS device_model text,
    ADD COLUMN IF NOT EXISTS os_version   text;

-- ════════════════════════════════════════════════════════════════════
-- 3) EL HILO DE CADA CASO
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.support_messages (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id      uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    autor          text NOT NULL CHECK (autor IN ('tripulante', 'casa')),
    body           text NOT NULL,
    admin_clerk_id text,          -- quién de la casa escribió (NULL si tripulante)
    read_at        timestamptz,   -- cuándo lo leyó el destinatario
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx
    ON public.support_messages (ticket_id, created_at ASC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_messages FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 4) admin_soporte_mensaje — LA CASA RESPONDE.
--    Un solo camino para tres cosas: responder un caso, avisar que una
--    transferencia quedó, y probar cómo se ve el aviso.
--
--    · p_ticket_id  → responde en ese caso.
--    · p_target_email (sin ticket) → ABRE un caso nuevo desde la casa. Así el
--      aviso de una transferencia hecha sin caso previo igual nace como hilo
--      que la persona puede contestar.
--    · p_plantilla = 'transferencia' → antepone el aviso estándar. El mensaje
--      libre se SUMA, no lo reemplaza: sin él la persona igual se entera de lo
--      esencial, que es lo único que no se puede omitir.
--    · p_prueba = true → NO toca el estado del caso y marca el hilo como
--      prueba, para ver el aviso real sin ensuciar la bandeja.
--    Dispara el push por el mismo camino que los DM (_push_dispatch).
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
                CASE WHEN status = 'nuevo' THEN 'en_curso' ELSE status END
            ),
            resolved_by = CASE WHEN v_status IN ('resuelto','cerrado')
                               THEN p_admin_clerk_id ELSE resolved_by END,
            resolved_at = CASE WHEN v_status IN ('resuelto','cerrado')
                               THEN now() ELSE resolved_at END,
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

-- ════════════════════════════════════════════════════════════════════
-- 5) admin_get_support_tickets — ahora trae el HILO y los no leídos.
--    Misma firma → no requiere tocar el gateway.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_support_tickets(
    p_admin_clerk_id text,
    p_status         text DEFAULT NULL,
    p_limit          integer DEFAULT 200
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_status   text := NULLIF(LOWER(TRIM(COALESCE(p_status, ''))), '');
    result     json;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT
            t.id, t.kind, t.message, t.fields, t.status, t.admin_note,
            t.platform, t.app_version, t.lang, t.device_model, t.os_version,
            t.email, t.clerk_user_id,
            t.created_at, t.resolved_at, t.resolved_by,
            (SELECT p.full_name FROM profiles p
              WHERE p.clerk_user_id = t.clerk_user_id LIMIT 1) AS full_name,
            (SELECT count(*) FROM support_actions a
              WHERE a.ticket_id = t.id) AS acciones,
            (
                SELECT COALESCE(json_agg(json_build_object(
                    'id', m.id, 'autor', m.autor, 'body', m.body,
                    'created_at', m.created_at, 'read_at', m.read_at
                ) ORDER BY m.created_at ASC), '[]'::json)
                FROM support_messages m WHERE m.ticket_id = t.id
            ) AS mensajes,
            (
                SELECT count(*) FROM support_messages m2
                WHERE m2.ticket_id = t.id
                  AND m2.autor = 'tripulante' AND m2.read_at IS NULL
            ) AS sin_leer
        FROM support_tickets t
        WHERE v_status IS NULL OR t.status = v_status
        ORDER BY t.created_at DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 1000)
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_support_tickets(text, text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_support_tickets(text, text, integer)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 6) EL LADO DEL TRIPULANTE (gateway user-action)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_support_tickets(
    p_clerk_user_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid text := NULLIF(TRIM(COALESCE(p_clerk_user_id, '')), '');
    result json;
BEGIN
    IF v_uid IS NULL THEN RETURN '[]'::json; END IF;

    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT
            t.id, t.kind, t.message, t.fields, t.status, t.created_at,
            (
                SELECT COALESCE(json_agg(json_build_object(
                    'id', m.id, 'autor', m.autor, 'body', m.body,
                    'created_at', m.created_at
                ) ORDER BY m.created_at ASC), '[]'::json)
                FROM support_messages m WHERE m.ticket_id = t.id
            ) AS mensajes,
            (
                SELECT count(*) FROM support_messages m2
                WHERE m2.ticket_id = t.id
                  AND m2.autor = 'casa' AND m2.read_at IS NULL
            ) AS sin_leer
        FROM support_tickets t
        WHERE t.clerk_user_id = v_uid
          AND t.status <> 'cerrado'
        ORDER BY t.created_at DESC
        LIMIT 20
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_support_tickets(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_support_tickets(text) TO service_role;

/* El Tripulante responde en SU caso. Si estaba resuelto, se reabre: nadie se
   queda sin voz porque del otro lado se dio por cerrado. */
CREATE OR REPLACE FUNCTION public.add_support_message(
    p_clerk_user_id text,
    p_ticket_id     uuid,
    p_body          text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    text := NULLIF(TRIM(COALESCE(p_clerk_user_id, '')), '');
    v_body   text := LEFT(TRIM(COALESCE(p_body, '')), 4000);
    v_owner  text;
    v_recientes integer;
BEGIN
    IF v_uid IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'sin_sesion');
    END IF;
    IF length(v_body) < 1 THEN
        RETURN json_build_object('ok', false, 'error', 'vacio');
    END IF;

    SELECT clerk_user_id INTO v_owner FROM support_tickets WHERE id = p_ticket_id;
    IF v_owner IS NULL OR v_owner <> v_uid THEN
        RETURN json_build_object('ok', false, 'error', 'no_es_tuyo');
    END IF;

    SELECT count(*) INTO v_recientes FROM support_messages
    WHERE ticket_id = p_ticket_id AND autor = 'tripulante'
      AND created_at > now() - interval '1 hour';
    IF v_recientes >= 20 THEN
        RETURN json_build_object('ok', false, 'error', 'demasiados');
    END IF;

    INSERT INTO support_messages (ticket_id, autor, body)
    VALUES (p_ticket_id, 'tripulante', v_body);

    UPDATE support_tickets
    SET status = CASE WHEN status IN ('resuelto','cerrado') THEN 'en_curso'
                      ELSE status END,
        updated_at = now()
    WHERE id = p_ticket_id;

    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.add_support_message(text, uuid, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_support_message(text, uuid, text) TO service_role;

/* Apaga el punto de no leído del lado que corresponda. */
CREATE OR REPLACE FUNCTION public.mark_support_read(
    p_clerk_user_id text,
    p_ticket_id     uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid   text := NULLIF(TRIM(COALESCE(p_clerk_user_id, '')), '');
    v_owner text;
BEGIN
    IF v_uid IS NULL THEN RETURN json_build_object('ok', false); END IF;
    SELECT clerk_user_id INTO v_owner FROM support_tickets WHERE id = p_ticket_id;
    IF v_owner IS NULL OR v_owner <> v_uid THEN
        RETURN json_build_object('ok', false, 'error', 'no_es_tuyo');
    END IF;
    UPDATE support_messages SET read_at = now()
    WHERE ticket_id = p_ticket_id AND autor = 'casa' AND read_at IS NULL;
    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_support_read(text, uuid)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_support_read(text, uuid) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 7) submit_support_ticket — recibe también el aparato y la versión del SO.
--    Firma NUEVA (dos params más con DEFAULT). Se borra la vieja para no
--    dejar una sobrecarga ambigua que PostgREST no sepa resolver.
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.submit_support_ticket(text, text, text, jsonb, text, text, text);

CREATE OR REPLACE FUNCTION public.submit_support_ticket(
    p_clerk_user_id text,
    p_kind          text DEFAULT 'otro',
    p_message       text DEFAULT '',
    p_fields        jsonb DEFAULT '{}'::jsonb,
    p_platform      text DEFAULT NULL,
    p_app_version   text DEFAULT NULL,
    p_lang          text DEFAULT NULL,
    p_device_model  text DEFAULT NULL,
    p_os_version    text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    text := NULLIF(TRIM(COALESCE(p_clerk_user_id, '')), '');
    v_kind   text := LOWER(NULLIF(TRIM(COALESCE(p_kind, '')), ''));
    v_msg    text := LEFT(TRIM(COALESCE(p_message, '')), 4000);
    v_fields jsonb := COALESCE(p_fields, '{}'::jsonb);
    v_email  text;
    v_id     uuid;
    v_recientes integer;
BEGIN
    IF v_uid IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'sin_sesion');
    END IF;
    IF v_kind IS NULL OR v_kind NOT IN
        ('acceso_pago', 'cobro', 'tecnico', 'cuenta', 'otro') THEN
        v_kind := 'otro';
    END IF;
    IF length(v_msg) < 2 AND v_fields = '{}'::jsonb THEN
        RETURN json_build_object('ok', false, 'error', 'vacio');
    END IF;
    IF jsonb_typeof(v_fields) <> 'object' THEN
        v_fields := '{}'::jsonb;
    END IF;

    SELECT count(*) INTO v_recientes
    FROM support_tickets
    WHERE clerk_user_id = v_uid AND created_at > now() - interval '1 hour';
    IF v_recientes >= 5 THEN
        RETURN json_build_object('ok', false, 'error', 'demasiados');
    END IF;

    SELECT email INTO v_email FROM profiles WHERE clerk_user_id = v_uid LIMIT 1;

    INSERT INTO support_tickets (
        clerk_user_id, email, kind, message, fields,
        platform, app_version, lang, device_model, os_version
    ) VALUES (
        v_uid,
        NULLIF(LOWER(TRIM(COALESCE(v_email, ''))), ''),
        v_kind, v_msg, v_fields,
        NULLIF(TRIM(COALESCE(p_platform, '')), ''),
        NULLIF(TRIM(COALESCE(p_app_version, '')), ''),
        NULLIF(TRIM(COALESCE(p_lang, '')), ''),
        NULLIF(TRIM(COALESCE(p_device_model, '')), ''),
        NULLIF(TRIM(COALESCE(p_os_version, '')), '')
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_support_ticket(text, text, text, jsonb, text, text, text, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_support_ticket(text, text, text, jsonb, text, text, text, text, text)
    TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
