-- Red Solar Viva · 20260807_soporte.sql — PANEL DE SOPORTE (primer caso:
-- TRANSFERIR SUSCRIPCIÓN) + la puerta de contacto de Ajustes.
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- EL PROBLEMA. El acceso comprado en la WEB se ata al CORREO CON EL QUE SE
-- PAGA (subscriptions.email es la llave; ver get_my_membership). Si alguien
-- paga con otro correo queda cobrado y sin acceso. El enlace de Stripe ya va
-- con su correo pre-llenado, pero no lo impide. Hasta hoy no había ni
-- herramienta para arreglarlo ni puerta clara para que avisara.
--
-- LO QUE CREA ESTE ARCHIVO:
--   · support_tickets   — los reportes que entran desde Ajustes → Soporte.
--   · support_actions   — LIBRO MAYOR: quién hizo qué, cuándo y sobre qué.
--     Toda acción del panel deja fila acá, sin excepción.
--   · submit_support_ticket        (Tripulante · gateway user-action)
--   · admin_get_support_tickets    (Motor · gateway admin-action)
--   · admin_set_support_ticket_status
--   · admin_soporte_buscar_cuenta  — el CRUCE: perfil + suscripciones +
--     pagos reales de un correo, para contrastar contra lo que la persona
--     dijo (últimos 4 / id de recibo / monto / fecha).
--   · admin_soporte_transferir_suscripcion — mueve la suscripción de un
--     correo a otro en un clic, con guardas y libro mayor.
--
-- GENÉRICO A PROPÓSITO. `support_tickets.kind` + `fields jsonb` sostienen
-- toda la familia que viene (reembolsos, cuentas duplicadas, cambio de
-- correo) sin tocar el esquema: cada caso nuevo es una clave más y su lista
-- de campos. `support_actions.action` hace lo mismo del lado de las
-- herramientas.
--
-- SEGURIDAD. Las dos tablas quedan con RLS activo y SIN policies → solo
-- service_role (los gateways verificados) entra. Ninguna RPC se otorga a
-- anon: el gate es el gateway, y las admin_* revalidan is_admin adentro.

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1) TABLAS
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text,                          -- quién reporta (verificado)
    email         text,                          -- su correo de cuenta (server-side)
    kind          text NOT NULL DEFAULT 'otro',  -- acceso_pago | cobro | tecnico | cuenta | otro
    message       text NOT NULL DEFAULT '',
    fields        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- respuestas del caso
    platform      text,                          -- ios | android | web
    app_version   text,
    lang          text,
    status        text NOT NULL DEFAULT 'nuevo', -- nuevo | en_curso | resuelto | cerrado
    admin_note    text,
    resolved_by   text,
    resolved_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx
    ON public.support_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx
    ON public.support_tickets (status, created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_tickets FROM PUBLIC, anon, authenticated;

-- Libro mayor de acciones del panel. Nada de lo que el panel hace queda sin
-- rastro: quién, cuándo, sobre qué, y el antes/después completo en `detalle`.
CREATE TABLE IF NOT EXISTS public.support_actions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id      uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
    admin_clerk_id text NOT NULL,
    action         text NOT NULL,   -- transferir_suscripcion | (los que vengan)
    target_ref     text,            -- id del objeto tocado (uuid de la sub, etc.)
    detalle        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_actions_created_idx
    ON public.support_actions (created_at DESC);

ALTER TABLE public.support_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_actions FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 2) submit_support_ticket — el Tripulante reporta (gateway user-action).
--    El correo NO es parámetro: se resuelve server-side contra profiles con
--    el id verificado que inyecta el gateway. Así el ticket siempre dice de
--    qué cuenta salió, sin que el cliente pueda mentir ni tener que
--    escribirlo.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.submit_support_ticket(
    p_clerk_user_id text,
    p_kind          text DEFAULT 'otro',
    p_message       text DEFAULT '',
    p_fields        jsonb DEFAULT '{}'::jsonb,
    p_platform      text DEFAULT NULL,
    p_app_version   text DEFAULT NULL,
    p_lang          text DEFAULT NULL
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
    /* Un reporte sin nada escrito Y sin ningún campo no sirve de nada. */
    IF length(v_msg) < 2 AND v_fields = '{}'::jsonb THEN
        RETURN json_build_object('ok', false, 'error', 'vacio');
    END IF;
    IF jsonb_typeof(v_fields) <> 'object' THEN
        v_fields := '{}'::jsonb;
    END IF;

    /* Anti-inundación: 5 reportes por hora y cuenta. Suficiente para
       corregir un dato mal escrito, imposible para llenar la bandeja. */
    SELECT count(*) INTO v_recientes
    FROM support_tickets
    WHERE clerk_user_id = v_uid
      AND created_at > now() - interval '1 hour';
    IF v_recientes >= 5 THEN
        RETURN json_build_object('ok', false, 'error', 'demasiados');
    END IF;

    SELECT email INTO v_email FROM profiles
    WHERE clerk_user_id = v_uid LIMIT 1;

    INSERT INTO support_tickets (
        clerk_user_id, email, kind, message, fields,
        platform, app_version, lang
    ) VALUES (
        v_uid,
        NULLIF(LOWER(TRIM(COALESCE(v_email, ''))), ''),
        v_kind,
        v_msg,
        v_fields,
        NULLIF(TRIM(COALESCE(p_platform, '')), ''),
        NULLIF(TRIM(COALESCE(p_app_version, '')), ''),
        NULLIF(TRIM(COALESCE(p_lang, '')), '')
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_support_ticket(text, text, text, jsonb, text, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.submit_support_ticket(text, text, text, jsonb, text, text, text)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 3) admin_get_support_tickets — la bandeja del Motor.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_support_tickets(
    p_admin_clerk_id text,
    p_status         text DEFAULT NULL,   -- NULL = todos
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
            t.platform, t.app_version, t.lang,
            t.email, t.clerk_user_id,
            t.created_at, t.resolved_at, t.resolved_by,
            (SELECT p.full_name FROM profiles p
              WHERE p.clerk_user_id = t.clerk_user_id LIMIT 1) AS full_name,
            (SELECT count(*) FROM support_actions a
              WHERE a.ticket_id = t.id) AS acciones
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
GRANT  EXECUTE ON FUNCTION public.admin_get_support_tickets(text, text, integer)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 4) admin_set_support_ticket_status — mover un caso de estado + nota.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_set_support_ticket_status(
    p_admin_clerk_id text,
    p_ticket_id      uuid,
    p_status         text,
    p_note           text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_status   text := LOWER(TRIM(COALESCE(p_status, '')));
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;
    IF v_status NOT IN ('nuevo', 'en_curso', 'resuelto', 'cerrado') THEN
        RETURN json_build_object('ok', false, 'error', 'estado_invalido');
    END IF;

    UPDATE support_tickets
    SET status      = v_status,
        admin_note  = COALESCE(NULLIF(TRIM(COALESCE(p_note, '')), ''), admin_note),
        resolved_by = CASE WHEN v_status IN ('resuelto', 'cerrado')
                           THEN p_admin_clerk_id ELSE resolved_by END,
        resolved_at = CASE WHEN v_status IN ('resuelto', 'cerrado')
                           THEN now() ELSE NULL END,
        updated_at  = now()
    WHERE id = p_ticket_id;

    IF NOT FOUND THEN
        RETURN json_build_object('ok', false, 'error', 'no_existe');
    END IF;

    INSERT INTO support_actions (ticket_id, admin_clerk_id, action, target_ref, detalle)
    VALUES (p_ticket_id, p_admin_clerk_id, 'cambiar_estado', p_ticket_id::text,
            jsonb_build_object('status', v_status,
                               'nota', NULLIF(TRIM(COALESCE(p_note, '')), '')));

    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_support_ticket_status(text, uuid, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_support_ticket_status(text, uuid, text, text)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 5) admin_soporte_buscar_cuenta — EL CRUCE.
--    Dado un correo, devuelve su perfil, sus suscripciones y sus pagos
--    REALES (monto, fecha, id de factura, liga del recibo). Con eso el
--    panel contrasta lo que la persona dijo contra lo que Stripe cobró:
--    nadie de fuera conoce el id del recibo ni la fecha exacta del cargo.
--    Los últimos 4 de la tarjeta no viven en nuestra base — los trae la
--    edge `soporte-stripe`, que pregunta a Stripe por el mismo customer.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_soporte_buscar_cuenta(
    p_admin_clerk_id text,
    p_email          text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_email    text := LOWER(TRIM(COALESCE(p_email, '')));
    v_perfil   jsonb;
    v_subs     jsonb;
    v_pagos    jsonb;
    v_compras  integer;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('error', 'unauthorized');
    END IF;
    IF length(v_email) < 3 THEN
        RETURN jsonb_build_object('error', 'correo_invalido');
    END IF;

    /* Un correo PUEDE tener más de un perfil (cuentas repetidas son otro caso
       de esta misma familia). Se elige siempre el mismo: el que sí tiene
       cuenta de Clerk. Sin ORDER BY, dos búsquedas seguidas podrían devolver
       perfiles distintos y la transferencia apuntaría a otro lado. */
    SELECT to_jsonb(x) INTO v_perfil FROM (
        SELECT p.id, p.clerk_user_id, p.email, p.full_name
        FROM profiles p
        WHERE LOWER(TRIM(p.email)) = v_email
        ORDER BY (p.clerk_user_id IS NULL), p.id
        LIMIT 1
    ) x;

    SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.current_period_end DESC NULLS LAST), '[]'::jsonb)
    INTO v_subs FROM (
        SELECT
            su.id, su.email, su.customer_name, su.status, su.group_name,
            su.current_period_start, su.current_period_end,
            su.cancel_at_period_end, su.promo_code,
            su.stripe_subscription_id, su.stripe_customer_id,
            su.user_id
        FROM subscriptions su
        WHERE LOWER(TRIM(su.email)) = v_email
    ) s;

    SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.paid_at DESC NULLS LAST), '[]'::jsonb)
    INTO v_pagos FROM (
        SELECT
            pl.id, pl.email, pl.description, pl.payment_type, pl.status,
            pl.amount_cents, pl.currency, pl.paid_at,
            pl.stripe_invoice_id, pl.stripe_subscription_id,
            pl.stripe_hosted_invoice_url
        FROM payments_log pl
        WHERE LOWER(TRIM(pl.email)) = v_email
        ORDER BY pl.paid_at DESC NULLS LAST
        LIMIT 40
    ) g;

    SELECT count(*) INTO v_compras FROM purchases pu
    WHERE LOWER(TRIM(pu.email)) = v_email;

    RETURN jsonb_build_object(
        'email',   v_email,
        'perfil',  v_perfil,
        'subs',    v_subs,
        'pagos',   v_pagos,
        'compras', v_compras
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_soporte_buscar_cuenta(text, text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_soporte_buscar_cuenta(text, text)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 6) admin_soporte_transferir_suscripcion — LA HERRAMIENTA.
--    Mueve UNA suscripción (por su uuid, nunca por correo: una persona
--    puede tener varias) del correo con el que se pagó al correo destino.
--    Mueve las tres cosas que la identifican: `email` (la llave de acceso,
--    ver get_my_membership), `user_id` (el perfil dueño) y `customer_name`.
--
--    GUARDAS:
--      · el destino DEBE tener cuenta creada (profiles). Sin eso, el acceso
--        se movería a la nada.
--      · si el destino YA tiene una suscripción activa del MISMO grupo, no
--        se transfiere: sería duplicar el acceso y esconder un cobro doble.
--        Se devuelve el motivo para que el Arquitecto decida.
--      · origen y destino distintos.
--    Toda transferencia deja fila en support_actions con el antes y el
--    después completos.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_soporte_transferir_suscripcion(
    p_admin_clerk_id  text,
    p_subscription_id uuid,
    p_to_email        text,
    p_ticket_id       uuid DEFAULT NULL,
    p_motivo          text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin  boolean;
    v_to        text := LOWER(TRIM(COALESCE(p_to_email, '')));
    v_sub       record;
    v_destino   record;
    v_dup       integer;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
    END IF;
    IF length(v_to) < 3 OR position('@' in v_to) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'correo_destino_invalido');
    END IF;

    SELECT * INTO v_sub FROM subscriptions WHERE id = p_subscription_id;
    IF v_sub.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'suscripcion_no_existe');
    END IF;
    IF LOWER(TRIM(COALESCE(v_sub.email, ''))) = v_to THEN
        RETURN jsonb_build_object('ok', false, 'error', 'mismo_correo');
    END IF;

    /* Mismo orden determinista que admin_soporte_buscar_cuenta: si el correo
       tiene perfiles repetidos, gana el que tiene cuenta de Clerk — y las dos
       pantallas coinciden siempre en cuál. */
    SELECT p.id, p.clerk_user_id, p.full_name, p.email
    INTO v_destino
    FROM profiles p
    WHERE LOWER(TRIM(p.email)) = v_to
    ORDER BY (p.clerk_user_id IS NULL), p.id
    LIMIT 1;
    IF v_destino.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'destino_sin_cuenta');
    END IF;

    SELECT count(*) INTO v_dup
    FROM subscriptions s
    WHERE LOWER(TRIM(s.email)) = v_to
      AND s.id <> v_sub.id
      AND s.status IN ('active', 'trialing')
      AND COALESCE(s.group_name, '') = COALESCE(v_sub.group_name, '')
      AND (s.current_period_end IS NULL OR s.current_period_end > now());
    IF v_dup > 0 THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'destino_ya_tiene_activa',
            'group_name', v_sub.group_name
        );
    END IF;

    UPDATE subscriptions
    SET email         = v_destino.email,
        user_id       = v_destino.id,
        customer_name = COALESCE(NULLIF(TRIM(COALESCE(v_destino.full_name, '')), ''), customer_name),
        updated_at    = now()
    WHERE id = v_sub.id;

    INSERT INTO support_actions (ticket_id, admin_clerk_id, action, target_ref, detalle)
    VALUES (
        p_ticket_id, p_admin_clerk_id, 'transferir_suscripcion', v_sub.id::text,
        jsonb_build_object(
            'de',            v_sub.email,
            'a',             v_destino.email,
            'group_name',    v_sub.group_name,
            'status',        v_sub.status,
            'stripe_sub_id', v_sub.stripe_subscription_id,
            'user_id_antes', v_sub.user_id,
            'user_id_ahora', v_destino.id,
            'motivo',        NULLIF(TRIM(COALESCE(p_motivo, '')), '')
        )
    );

    IF p_ticket_id IS NOT NULL THEN
        UPDATE support_tickets
        SET status = 'resuelto', resolved_by = p_admin_clerk_id,
            resolved_at = now(), updated_at = now()
        WHERE id = p_ticket_id;
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'de', v_sub.email,
        'a', v_destino.email,
        'group_name', v_sub.group_name,
        'destino_clerk_id', v_destino.clerk_user_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_soporte_transferir_suscripcion(text, uuid, text, uuid, text)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_soporte_transferir_suscripcion(text, uuid, text, uuid, text)
    TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 7) admin_soporte_bitacora — el libro mayor, para leerlo desde el panel.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_soporte_bitacora(
    p_admin_clerk_id text,
    p_limit          integer DEFAULT 100
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
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
            a.id, a.ticket_id, a.action, a.target_ref, a.detalle, a.created_at,
            (SELECT p.full_name FROM profiles p
              WHERE p.clerk_user_id = a.admin_clerk_id LIMIT 1) AS admin_nombre
        FROM support_actions a
        ORDER BY a.created_at DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_soporte_bitacora(text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_soporte_bitacora(text, integer)
    TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
