-- Red Solar Viva · EL MURO DE SINTONÍA SE MIDE (2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Idempotente: se puede correr dos veces sin daño.
--
-- Auditoría de precios del 2026-10-18: «hoy no hay forma de saber cuántas
-- personas ven el muro, y es la señal que decide el precio». La app (desde
-- la versión que trae lib/muroTelemetria.ts) anota cada apertura de un muro
-- de Sintonía Solar y lo que pasa en ella:
--   visto · plan · intento · compra · cancelada · error · cerrado ·
--   motivo (la respuesta a «¿Qué te detuvo?») · restaurado
--
-- (1) muro_eventos: una fila por evento. RLS sin políticas: nadie la lee
--     ni la escribe directo; solo estas funciones.
-- (2) record_muro_evento: con sesión, por el portón user-action (que pone el
--     clerk_user_id VERIFICADO; nadie firma por otro). Solo service_role.
-- (3) record_muro_evento_anon: sin sesión (bienvenida, web sin cuenta): la
--     misma escritura sin cuenta, con un id anónimo de aparato.
-- (4) admin_muro_resumen: lo que pinta Motor → Onboarding → «El muro de
--     Sintonía» (vía admin-action). Cruza con subscriptions para contar
--     también lo que se pagó en la web (Stripe no avisa a la app).
-- Retención: un año (purga oportunista, ~1 % de las escrituras).

-- ── (1) La tabla ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.muro_eventos (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at    timestamptz NOT NULL DEFAULT now(),
    clerk_user_id text,
    dispositivo   uuid,
    apertura      uuid NOT NULL,
    muro          text NOT NULL,
    evento        text NOT NULL,
    plan          text,
    motivo        text,
    miembro       boolean,
    plataforma    text,
    version       text,
    detalle       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS muro_eventos_creado
    ON public.muro_eventos (created_at DESC);
CREATE INDEX IF NOT EXISTS muro_eventos_apertura
    ON public.muro_eventos (apertura);
CREATE INDEX IF NOT EXISTS muro_eventos_cuenta
    ON public.muro_eventos (clerk_user_id, created_at DESC)
    WHERE clerk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS muro_eventos_dispositivo
    ON public.muro_eventos (dispositivo, created_at DESC)
    WHERE dispositivo IS NOT NULL;

ALTER TABLE public.muro_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.muro_eventos FROM PUBLIC, anon, authenticated;

-- ── (2) Escritura con cuenta (vía user-action) ───────────────────────
CREATE OR REPLACE FUNCTION public.record_muro_evento(
    p_clerk_user_id text,
    p_apertura      uuid,
    p_muro          text,
    p_evento        text,
    p_plan          text    DEFAULT NULL,
    p_motivo        text    DEFAULT NULL,
    p_miembro       boolean DEFAULT NULL,
    p_plataforma    text    DEFAULT NULL,
    p_version       text    DEFAULT NULL,
    p_detalle       jsonb   DEFAULT NULL,
    p_dispositivo   uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cuenta  text := NULLIF(left(btrim(coalesce(p_clerk_user_id, '')), 64), '');
    v_detalle jsonb := coalesce(p_detalle, '{}'::jsonb);
BEGIN
    IF p_apertura IS NULL
       OR p_muro IS NULL OR p_muro !~ '^[a-z_]{2,32}$'
       OR p_evento IS NULL
       OR p_evento NOT IN ('visto', 'plan', 'intento', 'compra', 'cancelada',
                           'error', 'cerrado', 'motivo', 'restaurado') THEN
        RETURN;
    END IF;
    IF jsonb_typeof(v_detalle) <> 'object' OR length(v_detalle::text) > 1500 THEN
        v_detalle := '{}'::jsonb;
    END IF;

    /* Freno de inundación: una apertura no tiene 60 eventos, ni una cuenta
       o un aparato 500 en un día. Pasado eso, se ignora en silencio. */
    IF (SELECT count(*) FROM public.muro_eventos WHERE apertura = p_apertura) >= 60 THEN
        RETURN;
    END IF;
    IF v_cuenta IS NOT NULL AND (
        SELECT count(*) FROM public.muro_eventos
        WHERE clerk_user_id = v_cuenta AND created_at > now() - interval '1 day'
    ) >= 500 THEN
        RETURN;
    END IF;
    IF v_cuenta IS NULL AND p_dispositivo IS NOT NULL AND (
        SELECT count(*) FROM public.muro_eventos
        WHERE dispositivo = p_dispositivo AND created_at > now() - interval '1 day'
    ) >= 500 THEN
        RETURN;
    END IF;

    /* Purga oportunista (~1 % de las escrituras): un año de historia. */
    IF random() < 0.01 THEN
        DELETE FROM public.muro_eventos WHERE created_at < now() - interval '365 days';
    END IF;

    INSERT INTO public.muro_eventos (
        clerk_user_id, dispositivo, apertura, muro, evento, plan, motivo,
        miembro, plataforma, version, detalle
    ) VALUES (
        v_cuenta,
        p_dispositivo,
        p_apertura,
        p_muro,
        p_evento,
        CASE WHEN p_plan IN ('weekly', 'monthly') THEN p_plan END,
        CASE WHEN p_evento = 'motivo' AND p_motivo ~ '^[a-z_]{2,24}$' THEN p_motivo END,
        p_miembro,
        NULLIF(left(coalesce(p_plataforma, ''), 24), ''),
        NULLIF(left(coalesce(p_version, ''), 24), ''),
        v_detalle
    );
END $$;

REVOKE ALL ON FUNCTION public.record_muro_evento(
    text, uuid, text, text, text, text, boolean, text, text, jsonb, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_muro_evento(
    text, uuid, text, text, text, text, boolean, text, text, jsonb, uuid
) TO service_role;

-- ── (3) Escritura sin cuenta (anónima) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.record_muro_evento_anon(
    p_apertura    uuid,
    p_muro        text,
    p_evento      text,
    p_plan        text    DEFAULT NULL,
    p_motivo      text    DEFAULT NULL,
    p_miembro     boolean DEFAULT NULL,
    p_plataforma  text    DEFAULT NULL,
    p_version     text    DEFAULT NULL,
    p_detalle     jsonb   DEFAULT NULL,
    p_dispositivo uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.record_muro_evento(
        NULL, p_apertura, p_muro, p_evento, p_plan, p_motivo, p_miembro,
        p_plataforma, p_version, p_detalle, p_dispositivo
    );
$$;

REVOKE ALL ON FUNCTION public.record_muro_evento_anon(
    uuid, text, text, text, text, boolean, text, text, jsonb, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_muro_evento_anon(
    uuid, text, text, text, text, boolean, text, text, jsonb, uuid
) TO anon, authenticated, service_role;

-- ── (4) Lectura del Motor (vía admin-action) ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_muro_resumen(
    p_admin_clerk_id text,
    p_days           int DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
    v_out   json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    WITH
    -- Las cuentas de la casa (administradores y las excluidas del ingreso)
    -- no cuentan: sus pruebas no son tripulantes.
    casa AS (
        SELECT p.clerk_user_id
        FROM public.profiles p
        WHERE p.clerk_user_id IS NOT NULL
          AND (COALESCE(p.is_admin, false)
               OR lower(coalesce(p.email, '')) IN (
                   SELECT lower(email) FROM public.revenue_exclusions
                   WHERE email IS NOT NULL))
    ),
    ev AS (
        SELECT e.*
        FROM public.muro_eventos e
        WHERE e.created_at > now() - make_interval(days => GREATEST(p_days, 1))
          AND (e.clerk_user_id IS NULL
               OR e.clerk_user_id NOT IN (SELECT clerk_user_id FROM casa))
    ),
    -- Una fila por apertura de un muro.
    ap AS (
        SELECT
            apertura,
            min(created_at) AS abierta,
            (array_agg(muro ORDER BY created_at))[1] AS muro,
            (array_agg(clerk_user_id ORDER BY created_at))[1] AS cuenta,
            (array_agg(dispositivo ORDER BY created_at))[1] AS dispositivo,
            (array_agg(plataforma ORDER BY created_at))[1] AS plataforma,
            COALESCE(bool_or(miembro), false) AS miembro,
            bool_or(evento = 'visto') AS visto,
            bool_or(evento = 'intento') AS intento,
            bool_or(evento = 'compra') AS compra_app,
            bool_or(evento = 'restaurado') AS restaurado,
            bool_or(evento = 'cancelada') AS cancelada,
            bool_or(evento = 'error') AS error,
            bool_or(evento = 'cerrado') AS cerrado,
            (array_agg(motivo ORDER BY created_at DESC)
                FILTER (WHERE evento = 'motivo'))[1] AS motivo,
            (array_agg(plan ORDER BY created_at DESC)
                FILTER (WHERE evento IN ('plan', 'intento', 'compra')
                        AND plan IS NOT NULL))[1] AS plan,
            (array_agg(plan ORDER BY created_at DESC)
                FILTER (WHERE evento = 'intento' AND plan IS NOT NULL))[1] AS plan_intento,
            (array_agg(plan ORDER BY created_at DESC)
                FILTER (WHERE evento = 'compra' AND plan IS NOT NULL))[1] AS plan_compra
        FROM ev
        GROUP BY apertura
    ),
    -- Pagos reales (no regalos) de Sintonía o Inmersión, por cuenta. Lo que
    -- se paga en la web no avisa a la app: se cruza aquí.
    pagos AS (
        SELECT DISTINCT p.clerk_user_id AS cuenta, s.created_at
        FROM public.subscriptions s
        JOIN public.profiles p
          ON p.id = s.user_id
          OR (s.email IS NOT NULL AND lower(s.email) = lower(p.email))
        WHERE p.clerk_user_id IS NOT NULL
          AND lower(coalesce(s.group_name, '')) IN ('sintonia', 'inmersion')
          AND coalesce(s.stripe_subscription_id, '') NOT ILIKE 'gift%'
    ),
    -- Los muros vistos por quien NO es miembro (el aviso del semanal y su
    -- selector van aparte, abajo).
    vis AS (
        SELECT a.*
        FROM ap a
        WHERE NOT a.miembro
          AND a.muro NOT IN ('aviso_semanal', 'semanal_mensual')
    ),
    -- Cada pago se atribuye a UN muro: el último donde tocó comprar en los 7
    -- días anteriores (o, si no tocó, el último que vio). Así quien vio tres
    -- muros y pagó una vez suma un pago, no tres.
    atribuido AS (
        SELECT DISTINCT (
            SELECT v.apertura FROM vis v
            WHERE v.cuenta = g.cuenta
              AND v.abierta <= g.created_at + interval '5 minutes'
              AND v.abierta >= g.created_at - interval '7 days'
            ORDER BY v.intento DESC, v.abierta DESC
            LIMIT 1
        ) AS apertura
        FROM pagos g
    ),
    emb AS (
        SELECT v.*,
               COALESCE(v.cuenta, v.dispositivo::text, v.apertura::text) AS persona,
               (v.compra_app
                OR v.apertura IN (SELECT apertura FROM atribuido
                                  WHERE apertura IS NOT NULL)) AS pago
        FROM vis v
    ),
    personas AS (
        SELECT persona,
               bool_or(intento) AS intento,
               bool_or(pago) AS pago
        FROM emb
        GROUP BY persona
    ),
    semanal AS (
        SELECT
            count(*) FILTER (WHERE muro = 'aviso_semanal') AS avisos,
            count(*) FILTER (WHERE muro = 'aviso_semanal' AND intento) AS abrieron,
            count(*) FILTER (WHERE muro = 'semanal_mensual'
                             AND compra_app AND plan_compra = 'monthly') AS pasaron
        FROM ap
    )
    SELECT json_build_object(
        'dias', GREATEST(p_days, 1),
        'desde', (now() - make_interval(days => GREATEST(p_days, 1))),
        'totales', json_build_object(
            'aperturas', (SELECT count(*) FROM emb),
            'personas', (SELECT count(*) FROM personas),
            'con_intento', (SELECT count(*) FROM personas WHERE intento),
            'pagaron', (SELECT count(*) FROM personas WHERE pago),
            'cerrados', (SELECT count(*) FROM emb WHERE cerrado AND NOT pago),
            'respondieron', (SELECT count(*) FROM emb
                             WHERE motivo IS NOT NULL AND motivo <> 'sin_motivo'),
            'miembros', (SELECT count(*) FROM ap WHERE miembro
                         AND muro NOT IN ('aviso_semanal', 'semanal_mensual'))
        ),
        'por_muro', COALESCE((
            SELECT json_agg(x ORDER BY x.aperturas DESC, x.muro)
            FROM (
                SELECT muro,
                       count(*) AS aperturas,
                       count(DISTINCT persona) AS personas,
                       count(*) FILTER (WHERE intento) AS intentos,
                       count(*) FILTER (WHERE pago) AS pagos,
                       count(*) FILTER (WHERE cerrado AND NOT pago) AS cerrados
                FROM emb
                GROUP BY muro
            ) x
        ), '[]'::json),
        'planes', json_build_object(
            'elegido_mensual', (SELECT count(*) FROM emb WHERE plan = 'monthly'),
            'elegido_semanal', (SELECT count(*) FROM emb WHERE plan = 'weekly'),
            'intento_mensual', (SELECT count(*) FROM emb WHERE plan_intento = 'monthly'),
            'intento_semanal', (SELECT count(*) FROM emb WHERE plan_intento = 'weekly'),
            'compra_mensual', (SELECT count(*) FROM emb WHERE plan_compra = 'monthly'),
            'compra_semanal', (SELECT count(*) FROM emb WHERE plan_compra = 'weekly')
        ),
        'motivos', COALESCE((
            SELECT json_object_agg(motivo, n)
            FROM (
                SELECT motivo, count(*) AS n FROM emb
                WHERE motivo IS NOT NULL GROUP BY motivo
            ) m
        ), '{}'::json),
        'plataformas', COALESCE((
            SELECT json_object_agg(pl, n)
            FROM (
                SELECT coalesce(plataforma, 'sin_dato') AS pl, count(*) AS n
                FROM emb GROUP BY 1
            ) q
        ), '{}'::json),
        'tienda', json_build_object(
            'canceladas', (SELECT count(*) FROM emb WHERE cancelada),
            'errores', (SELECT count(*) FROM emb WHERE error),
            'restauradas', (SELECT count(*) FROM emb WHERE restaurado)
        ),
        'semanal', (SELECT json_build_object(
            'avisos', avisos, 'abrieron', abrieron, 'pasaron', pasaron)
            FROM semanal),
        'recientes', COALESCE((
            SELECT json_agg(r ORDER BY r.abierta DESC)
            FROM (
                SELECT a.apertura,
                       a.abierta,
                       a.muro,
                       a.plataforma,
                       a.miembro,
                       a.plan,
                       a.motivo,
                       CASE
                           WHEN a.compra_app THEN 'compra'
                           -- Pagó (en la web o sin que la app alcanzara a
                           -- avisar): lo dice subscriptions.
                           WHEN a.apertura IN (SELECT apertura FROM atribuido
                                               WHERE apertura IS NOT NULL) THEN 'pago'
                           WHEN a.restaurado THEN 'restaurado'
                           WHEN a.error THEN 'error'
                           WHEN a.cancelada THEN 'cancelada'
                           WHEN a.intento THEN 'intento'
                           WHEN a.cerrado THEN 'cerrado'
                           ELSE 'abierto'
                       END AS resultado,
                       COALESCE(
                           NULLIF(btrim(pr.full_name), ''),
                           NULLIF(btrim(pr.email), ''),
                           CASE WHEN a.cuenta IS NULL THEN NULL ELSE 'Cuenta' END
                       ) AS quien
                FROM ap a
                LEFT JOIN LATERAL (
                    SELECT full_name, email FROM public.profiles
                    WHERE clerk_user_id = a.cuenta
                    LIMIT 1
                ) pr ON true
                ORDER BY a.abierta DESC
                LIMIT 40
            ) r
        ), '[]'::json)
    ) INTO v_out;
    RETURN v_out;
END $$;

REVOKE ALL ON FUNCTION public.admin_muro_resumen(text, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_muro_resumen(text, int) TO service_role;

NOTIFY pgrst, 'reload schema';
