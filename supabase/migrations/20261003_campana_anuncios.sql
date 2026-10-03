-- Red Solar Viva · MEDICIÓN DE ANUNCIOS DE LA LANDING (Zak 2026-10-03)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente: se puede correr dos veces sin daño.
--
-- Zak lanza anuncios de Meta (Instagram/Facebook), un video a la vez, que
-- llevan a escanervibracional.com/?a=<etiqueta>. Quiere ver EL MISMO DÍA,
-- en el Motor de Intervención (pestaña "Campaña"), qué pasó con su dinero:
-- cuánta gente llegó por el anuncio, cuántos tocaron App Store o Google
-- Play, cuántos abrieron la app por primera vez, cuántos hicieron cuenta y
-- cuántos se suscribieron.
--
-- Piezas:
--   1. campana_eventos — lo que la landing registra (visita y toques a las
--      tiendas), con un identificador ANÓNIMO del navegador. Sin nombre, sin
--      correo, sin IP. RLS activo sin policies: solo las funciones entran.
--   2. record_campana_evento — la puerta pública (anon) que solo INSERTA, con
--      validación y anti-inundación.
--   3. campana_gasto — lo que Zak gastó por día (lo escribe a mano en el
--      Motor). Solo el Motor lo toca.
--   4. campana_ajustes + get_campana_pixel — el número del píxel de Meta que
--      la landing carga sola. La lectura pública devuelve SOLO ese número.
--   5. RPCs admin (solo service_role, por el gateway admin-action, con el
--      doble blindaje de la casa: el gateway verifica el token y la RPC
--      revalida is_admin con el id inyectado):
--        admin_campana_diario · admin_campana_set_gasto ·
--        admin_campana_set_pixel · admin_campana_estado
--
-- Días en hora de Cancún (America/Cancun, UTC-5 todo el año), igual que la
-- Telemetría de Navegación.

-- ── 1. Tablas ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campana_eventos (
    id            bigserial PRIMARY KEY,
    created_at    timestamptz NOT NULL DEFAULT now(),
    -- Etiqueta del anuncio (?a= de la URL), p. ej. 'decodificador'.
    -- NULL = llegó sin anuncio (orgánico).
    etiqueta      text NULL
                  CHECK (etiqueta IS NULL OR etiqueta ~ '^[a-z0-9-]{1,40}$'),
    evento        text NOT NULL
                  CHECK (evento IN ('visita', 'tienda_ios', 'tienda_android', 'tienda_mac', 'web')),
    plataforma    text NOT NULL
                  CHECK (plataforma IN ('ios', 'android', 'desktop', 'otro')),
    -- Navegador dentro de una app (instagram / facebook / tiktok / otro).
    -- NULL = navegador normal.
    navegador_app text NULL,
    -- uuid anónimo que la landing guarda en el navegador (no identifica a
    -- nadie: sirve para no contar diez veces a la misma persona).
    visitante     uuid NOT NULL
);

CREATE INDEX IF NOT EXISTS campana_eventos_created_idx
    ON public.campana_eventos (created_at);
CREATE INDEX IF NOT EXISTS campana_eventos_visitante_idx
    ON public.campana_eventos (visitante, created_at DESC);

ALTER TABLE public.campana_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campana_eventos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.campana_eventos_id_seq FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.campana_gasto (
    dia        date NOT NULL,
    -- '' = el gasto del día sin etiqueta específica.
    etiqueta   text NOT NULL DEFAULT '',
    monto_mxn  numeric(10, 2) NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (dia, etiqueta)
);

ALTER TABLE public.campana_gasto ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campana_gasto FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.campana_ajustes (
    clave      text PRIMARY KEY,
    valor      text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campana_ajustes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campana_ajustes FROM PUBLIC, anon, authenticated;

-- ── 2. La puerta pública: la landing registra, jamás lee ──────────────

CREATE OR REPLACE FUNCTION public.record_campana_evento(
    p_etiqueta      text DEFAULT NULL,
    p_evento        text DEFAULT NULL,
    p_plataforma    text DEFAULT NULL,
    p_navegador_app text DEFAULT NULL,
    p_visitante     uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_etiqueta   text := lower(btrim(COALESCE(p_etiqueta, '')));
    v_evento     text := lower(btrim(COALESCE(p_evento, '')));
    v_plataforma text := lower(btrim(COALESCE(p_plataforma, '')));
    v_app        text := NULLIF(left(lower(btrim(COALESCE(p_navegador_app, ''))), 20), '');
    v_hoy        timestamptz :=
        date_trunc('day', now() AT TIME ZONE 'America/Cancun') AT TIME ZONE 'America/Cancun';
BEGIN
    IF p_visitante IS NULL THEN
        RETURN;
    END IF;
    IF v_evento NOT IN ('visita', 'tienda_ios', 'tienda_android', 'tienda_mac', 'web') THEN
        RETURN;
    END IF;
    IF v_plataforma NOT IN ('ios', 'android', 'desktop', 'otro') THEN
        RETURN;
    END IF;
    -- Una etiqueta que no cumple el formato no tumba el registro: se
    -- guarda como orgánico.
    IF v_etiqueta !~ '^[a-z0-9-]{1,40}$' THEN
        v_etiqueta := NULL;
    END IF;

    -- Anti-inundación 1: el mismo visitante, el mismo evento y la misma
    -- etiqueta en los últimos 10 segundos (recargas, doble toque).
    IF EXISTS (
        SELECT 1 FROM public.campana_eventos e
        WHERE e.visitante = p_visitante
          AND e.evento = v_evento
          AND e.etiqueta IS NOT DISTINCT FROM v_etiqueta
          AND e.created_at > now() - interval '10 seconds'
    ) THEN
        RETURN;
    END IF;

    -- Anti-inundación 2: tope de 60 eventos por visitante al día.
    IF (
        SELECT count(*) FROM (
            SELECT 1 FROM public.campana_eventos e
            WHERE e.visitante = p_visitante
              AND e.created_at >= v_hoy
            LIMIT 60
        ) x
    ) >= 60 THEN
        RETURN;
    END IF;

    -- Anti-inundación 3 (global): más de 300 eventos en un minuto ya no es
    -- gente. Con 100 MXN al día el tráfico real queda muy por debajo.
    IF (
        SELECT count(*) FROM (
            SELECT 1 FROM public.campana_eventos e
            WHERE e.created_at > now() - interval '1 minute'
            LIMIT 300
        ) x
    ) >= 300 THEN
        RETURN;
    END IF;

    /* Purga oportunista (~1% de los registros): retención 400 días. */
    IF random() < 0.01 THEN
        DELETE FROM public.campana_eventos
        WHERE created_at < now() - interval '400 days';
    END IF;

    INSERT INTO public.campana_eventos (etiqueta, evento, plataforma, navegador_app, visitante)
    VALUES (v_etiqueta, v_evento, v_plataforma, v_app, p_visitante);
END;
$$;

REVOKE ALL ON FUNCTION public.record_campana_evento(text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_campana_evento(text, text, text, text, uuid)
    TO anon, authenticated, service_role;

-- ── 3. El píxel de Meta: la landing pregunta cuál usar ─────────────────

CREATE OR REPLACE FUNCTION public.get_campana_pixel()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT a.valor
    FROM public.campana_ajustes a
    WHERE a.clave = 'meta_pixel_id'
      AND a.valor ~ '^[0-9]{8,20}$'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_campana_pixel() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_campana_pixel()
    TO anon, authenticated, service_role;

-- ── 4a. El Motor lee la campaña, un renglón por día ───────────────────
-- Devuelve un arreglo JSON con UN objeto por día del rango (los días vacíos
-- también aparecen, en cero), en orden ascendente:
--   dia                       'YYYY-MM-DD' (Cancún)
--   visitas                   personas distintas que abrieron la landing
--   visitas_anuncio           ídem, con etiqueta de anuncio
--   toques_ios / _android / _mac / _web
--                             personas distintas que tocaron cada botón
--                             (una persona que toca tres veces cuenta una)
--   toques_ios_anuncio / toques_android_anuncio
--                             ídem, solo quienes traían etiqueta de anuncio
--   etiquetas                 anuncios vistos ese día (arreglo de texto)
--   instalaciones             aparatos NUEVOS que abrieron la app (iPhone +
--                             Android) según el embudo del onboarding: una
--                             fila de onb_funnel nace con el PRIMER paso
--                             (started_at) y su id vive en el aparato. Las
--                             filas 'web' (la app en un navegador) no son
--                             instalaciones: van aparte en
--                             instalaciones_por_plataforma.
--   instalaciones_por_plataforma {ios, android, web}
--   instalaciones_por_puerta  {food, dream, energy, espejo, codice, vision,
--                             sin_puerta} de answers->>'origin' (lo escribe
--                             OnboardingV2 al elegir la puerta del Portal de
--                             Origen; sin_puerta = abrió y no eligió)
--   cuentas_nuevas            perfiles creados ese día (profiles.created_at;
--                             los crea clerk-webhook en user.created), sin
--                             cuentas internas, de prueba ni admins
--   suscripciones_nuevas      personas que se volvieron suscriptoras de
--                             Sintonía ese día: su PRIMERA fila pagada de
--                             membresía (sin cortesías gift_*, sin pagos
--                             incompletos, sin correos de revenue_exclusions).
--                             Una renovación actualiza la misma fila; volver
--                             tras cancelar tiene una fila previa y no cuenta.
--   suscripciones_por_origen  {web, ios, android, otro}: web = Stripe (sub_*),
--                             ios = RevenueCat con transacción numérica de
--                             Apple, android = RevenueCat con orden GPA.* de
--                             Google Play
--   gasto_mxn                 lo que Zak escribió para ese día (NULL = nada)
--   gasto_etiqueta            a qué anuncio quedó asignado ese gasto ('' =
--                             sin etiqueta)

CREATE OR REPLACE FUNCTION public.admin_campana_diario(
    p_desde          date,
    p_hasta          date,
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hasta  date := COALESCE(p_hasta, (now() AT TIME ZONE 'America/Cancun')::date);
    v_desde  date := COALESCE(p_desde, COALESCE(p_hasta, (now() AT TIME ZONE 'America/Cancun')::date) - 13);
    v_tmp    date;
    v_inicio timestamptz;
    v_fin    timestamptz;
    v_out    json;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_desde > v_hasta THEN
        v_tmp := v_desde; v_desde := v_hasta; v_hasta := v_tmp;
    END IF;
    -- Tope: 120 días por consulta (el panel pide 30 + 14 de base).
    IF v_hasta - v_desde > 119 THEN
        v_desde := v_hasta - 119;
    END IF;

    v_inicio := v_desde::timestamp AT TIME ZONE 'America/Cancun';
    v_fin    := (v_hasta + 1)::timestamp AT TIME ZONE 'America/Cancun';

    WITH dias AS (
        SELECT gs::date AS d
        FROM generate_series(v_desde::timestamp, v_hasta::timestamp, interval '1 day') AS gs
    ),
    ev AS (
        SELECT (e.created_at AT TIME ZONE 'America/Cancun')::date AS d,
               e.etiqueta, e.evento, e.visitante
        FROM public.campana_eventos e
        WHERE e.created_at >= v_inicio AND e.created_at < v_fin
    ),
    ev_dia AS (
        SELECT ev.d,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'visita')::int AS visitas,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'visita' AND ev.etiqueta IS NOT NULL)::int AS visitas_anuncio,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_ios')::int AS toques_ios,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_android')::int AS toques_android,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_mac')::int AS toques_mac,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'web')::int AS toques_web,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_ios' AND ev.etiqueta IS NOT NULL)::int AS toques_ios_anuncio,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_android' AND ev.etiqueta IS NOT NULL)::int AS toques_android_anuncio,
            COALESCE(
                array_agg(DISTINCT ev.etiqueta ORDER BY ev.etiqueta) FILTER (WHERE ev.etiqueta IS NOT NULL),
                ARRAY[]::text[]
            ) AS etiquetas
        FROM ev
        GROUP BY ev.d
    ),
    onb AS (
        SELECT (f.started_at AT TIME ZONE 'America/Cancun')::date AS d,
               COALESCE(f.platform, '') AS plataforma,
               COALESCE(NULLIF(f.answers->>'origin', ''), 'sin_puerta') AS puerta
        FROM public.onb_funnel f
        WHERE f.started_at >= v_inicio AND f.started_at < v_fin
    ),
    onb_dia AS (
        SELECT onb.d,
            count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android'))::int AS instalaciones,
            json_build_object(
                'ios',     count(*) FILTER (WHERE onb.plataforma = 'ios'),
                'android', count(*) FILTER (WHERE onb.plataforma = 'android'),
                'web',     count(*) FILTER (WHERE onb.plataforma NOT IN ('ios', 'android'))
            ) AS por_plataforma,
            json_build_object(
                'food',       count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android') AND onb.puerta = 'food'),
                'dream',      count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android') AND onb.puerta = 'dream'),
                'energy',     count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android') AND onb.puerta = 'energy'),
                'espejo',     count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android') AND onb.puerta = 'espejo'),
                'codice',     count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android') AND onb.puerta = 'codice'),
                'vision',     count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android') AND onb.puerta = 'vision'),
                'sin_puerta', count(*) FILTER (WHERE onb.plataforma IN ('ios', 'android')
                                               AND onb.puerta NOT IN ('food', 'dream', 'energy', 'espejo', 'codice', 'vision'))
            ) AS por_puerta
        FROM onb
        GROUP BY onb.d
    ),
    cuentas_dia AS (
        SELECT (p.created_at AT TIME ZONE 'America/Cancun')::date AS d,
               count(*)::int AS cuentas
        FROM public.profiles p
        WHERE p.created_at >= v_inicio AND p.created_at < v_fin
          AND COALESCE(p.clerk_user_id, '') <> ''
          AND NOT COALESCE(p.is_admin, false)
          AND COALESCE(p.email, '') NOT ILIKE '%@example.com'
          AND COALESCE(p.email, '') NOT ILIKE '%clerk_test%'
          -- Cuentas propias de la casa (mismo criterio que Navegación y Correos).
          AND lower(btrim(COALESCE(p.email, ''))) NOT IN (
              'cuerpodeluz555@gmail.com', 'diegosotoborjaalmeida@gmail.com',
              'diegosotoborja@gmail.com', 'andrea.dl13@gmail.com',
              'beachandsunrisecancun@gmail.com', 'veocancun@gmail.com',
              'veotuluzinterna@gmail.com', 'redsolarviva@gmail.com',
              'redsolarviva@pm.me', 'zakhaarsol@pm.me', 'zakhaar@pm.me'
          )
        GROUP BY 1
    ),
    pagadas AS (
        -- Filas PAGADAS de membresía completa (toda la historia: hace falta
        -- para saber si alguien ya había sido suscriptor antes).
        SELECT s.id, s.created_at, s.user_id, s.stripe_customer_id,
               s.stripe_subscription_id, s.group_name,
               lower(btrim(COALESCE(s.email, ''))) AS correo
        FROM public.subscriptions s
        WHERE s.created_at IS NOT NULL
          AND COALESCE(s.stripe_subscription_id, '') NOT LIKE 'gift_%'
          AND COALESCE(s.status, '') NOT IN ('incomplete', 'incomplete_expired')
          -- Sin grupo = fila vieja de Inmersión (mismo criterio que la
          -- Telemetría del Núcleo, que la lee como 'pulsar').
          AND COALESCE(s.group_name, 'pulsar') IN ('sintonia', 'cuasar', 'pulsar', 'inmersion')
          AND NOT EXISTS (
              SELECT 1 FROM public.revenue_exclusions x
              WHERE lower(btrim(x.email)) = lower(btrim(s.email))
          )
    ),
    nuevas AS (
        SELECT (p.created_at AT TIME ZONE 'America/Cancun')::date AS d,
               CASE
                   WHEN p.stripe_subscription_id LIKE 'sub_%' THEN 'web'
                   WHEN p.stripe_subscription_id LIKE 'rc_GPA.%' THEN 'android'
                   WHEN p.stripe_subscription_id ~ '^rc_[0-9]+$' THEN 'ios'
                   ELSE 'otro'
               END AS origen
        FROM pagadas p
        WHERE p.group_name = 'sintonia'
          AND p.created_at >= v_inicio AND p.created_at < v_fin
          AND NOT EXISTS (
              SELECT 1 FROM pagadas q
              WHERE (q.created_at < p.created_at
                     OR (q.created_at = p.created_at AND q.id::text < p.id::text))
                AND (
                    (q.user_id IS NOT NULL AND q.user_id = p.user_id)
                    OR (q.correo <> '' AND q.correo = p.correo)
                    OR (COALESCE(q.stripe_customer_id, '') <> ''
                        AND q.stripe_customer_id = p.stripe_customer_id)
                )
          )
    ),
    nuevas_dia AS (
        SELECT n.d,
               count(*)::int AS suscripciones,
               json_build_object(
                   'web',     count(*) FILTER (WHERE n.origen = 'web'),
                   'ios',     count(*) FILTER (WHERE n.origen = 'ios'),
                   'android', count(*) FILTER (WHERE n.origen = 'android'),
                   'otro',    count(*) FILTER (WHERE n.origen = 'otro')
               ) AS por_origen
        FROM nuevas n
        GROUP BY n.d
    ),
    gasto_dia AS (
        SELECT g.dia AS d,
               sum(g.monto_mxn) AS gasto,
               string_agg(g.etiqueta, ',' ORDER BY g.etiqueta) AS gasto_etiqueta
        FROM public.campana_gasto g
        WHERE g.dia BETWEEN v_desde AND v_hasta
        GROUP BY g.dia
    )
    SELECT COALESCE(json_agg(json_build_object(
        'dia',                          to_char(dias.d, 'YYYY-MM-DD'),
        'visitas',                      COALESCE(ev_dia.visitas, 0),
        'visitas_anuncio',              COALESCE(ev_dia.visitas_anuncio, 0),
        'toques_ios',                   COALESCE(ev_dia.toques_ios, 0),
        'toques_android',               COALESCE(ev_dia.toques_android, 0),
        'toques_mac',                   COALESCE(ev_dia.toques_mac, 0),
        'toques_web',                   COALESCE(ev_dia.toques_web, 0),
        'toques_ios_anuncio',           COALESCE(ev_dia.toques_ios_anuncio, 0),
        'toques_android_anuncio',       COALESCE(ev_dia.toques_android_anuncio, 0),
        'etiquetas',                    COALESCE(ev_dia.etiquetas, ARRAY[]::text[]),
        'instalaciones',                COALESCE(onb_dia.instalaciones, 0),
        'instalaciones_por_plataforma', COALESCE(onb_dia.por_plataforma,
                                            json_build_object('ios', 0, 'android', 0, 'web', 0)),
        'instalaciones_por_puerta',     COALESCE(onb_dia.por_puerta,
                                            json_build_object('food', 0, 'dream', 0, 'energy', 0,
                                                              'espejo', 0, 'codice', 0, 'vision', 0,
                                                              'sin_puerta', 0)),
        'cuentas_nuevas',               COALESCE(cuentas_dia.cuentas, 0),
        'suscripciones_nuevas',         COALESCE(nuevas_dia.suscripciones, 0),
        'suscripciones_por_origen',     COALESCE(nuevas_dia.por_origen,
                                            json_build_object('web', 0, 'ios', 0, 'android', 0, 'otro', 0)),
        'gasto_mxn',                    gasto_dia.gasto,
        'gasto_etiqueta',               gasto_dia.gasto_etiqueta
    ) ORDER BY dias.d), '[]'::json)
    INTO v_out
    FROM dias
    LEFT JOIN ev_dia      ON ev_dia.d      = dias.d
    LEFT JOIN onb_dia     ON onb_dia.d     = dias.d
    LEFT JOIN cuentas_dia ON cuentas_dia.d = dias.d
    LEFT JOIN nuevas_dia  ON nuevas_dia.d  = dias.d
    LEFT JOIN gasto_dia   ON gasto_dia.d   = dias.d;

    RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_diario(date, date, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_diario(date, date, text) TO service_role;

-- ── 4b. El gasto del día ──────────────────────────────────────────────
-- El panel escribe el gasto TOTAL de un día (Zak corre un video a la vez):
-- guardar REEMPLAZA lo que hubiera ese día, para que nunca se sumen dos
-- cifras del mismo día por error. La etiqueta dice a qué anuncio se asigna
-- ('' = sin etiqueta). Monto NULL o <= 0 borra el gasto de ese día.

CREATE OR REPLACE FUNCTION public.admin_campana_set_gasto(
    p_dia            date,
    p_etiqueta       text,
    p_monto          numeric,
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_etiqueta text := lower(btrim(COALESCE(p_etiqueta, '')));
    v_monto    numeric(10, 2);
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF p_dia IS NULL THEN
        RAISE EXCEPTION 'dia_requerido';
    END IF;
    IF v_etiqueta <> '' AND v_etiqueta !~ '^[a-z0-9-]{1,40}$' THEN
        RAISE EXCEPTION 'etiqueta_invalida';
    END IF;

    IF p_monto IS NULL OR p_monto <= 0 THEN
        DELETE FROM public.campana_gasto WHERE dia = p_dia;
        RETURN json_build_object('dia', p_dia, 'etiqueta', v_etiqueta, 'monto_mxn', NULL, 'borrado', true);
    END IF;

    IF p_monto >= 10000000 THEN
        RAISE EXCEPTION 'monto_fuera_de_rango';
    END IF;
    v_monto := round(p_monto, 2);

    DELETE FROM public.campana_gasto
    WHERE dia = p_dia AND etiqueta <> v_etiqueta;

    INSERT INTO public.campana_gasto (dia, etiqueta, monto_mxn, updated_at)
    VALUES (p_dia, v_etiqueta, v_monto, now())
    ON CONFLICT (dia, etiqueta) DO UPDATE
        SET monto_mxn = EXCLUDED.monto_mxn,
            updated_at = now();

    RETURN json_build_object('dia', p_dia, 'etiqueta', v_etiqueta, 'monto_mxn', v_monto, 'borrado', false);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_set_gasto(date, text, numeric, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_set_gasto(date, text, numeric, text) TO service_role;

-- ── 4c. Guardar el número del píxel de Meta ───────────────────────────
-- Solo dígitos (8 a 20). Cadena vacía lo borra: la landing deja de cargar
-- el píxel en la siguiente visita. Devuelve lo que quedó guardado ('' si
-- quedó vacío).

CREATE OR REPLACE FUNCTION public.admin_campana_set_pixel(
    p_pixel          text,
    p_admin_clerk_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pixel text := regexp_replace(COALESCE(p_pixel, ''), '\s', '', 'g');
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_pixel = '' THEN
        DELETE FROM public.campana_ajustes WHERE clave = 'meta_pixel_id';
        RETURN '';
    END IF;
    IF v_pixel !~ '^[0-9]{8,20}$' THEN
        RAISE EXCEPTION 'pixel_invalido';
    END IF;

    INSERT INTO public.campana_ajustes (clave, valor, updated_at)
    VALUES ('meta_pixel_id', v_pixel, now())
    ON CONFLICT (clave) DO UPDATE
        SET valor = EXCLUDED.valor,
            updated_at = now();

    RETURN v_pixel;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_set_pixel(text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_set_pixel(text, text) TO service_role;

-- ── 4d. Estado de la campaña (encabezado del panel) ───────────────────

CREATE OR REPLACE FUNCTION public.admin_campana_estado(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN json_build_object(
        'pixel', (
            SELECT a.valor FROM public.campana_ajustes a
            WHERE a.clave = 'meta_pixel_id'
        ),
        'pixel_actualizado', (
            SELECT a.updated_at FROM public.campana_ajustes a
            WHERE a.clave = 'meta_pixel_id'
        ),
        'primer_anuncio', (
            SELECT to_char((min(e.created_at) AT TIME ZONE 'America/Cancun')::date, 'YYYY-MM-DD')
            FROM public.campana_eventos e
            WHERE e.etiqueta IS NOT NULL
        ),
        'ultimo_anuncio', (
            SELECT max(e.created_at)
            FROM public.campana_eventos e
            WHERE e.etiqueta IS NOT NULL
        ),
        'ultimo_evento', (
            SELECT max(e.created_at) FROM public.campana_eventos e
        ),
        'hoy', to_char((now() AT TIME ZONE 'America/Cancun')::date, 'YYYY-MM-DD')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_estado(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_estado(text) TO service_role;

NOTIFY pgrst, 'reload schema';
