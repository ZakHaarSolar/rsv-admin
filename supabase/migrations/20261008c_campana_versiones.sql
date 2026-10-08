-- Red Solar Viva · LAS VERSIONES DE LA PÁGINA DE DESCARGA (Zak 2026-10-08)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente: se puede correr dos veces sin daño.
-- Requiere: ✅ 20261003_campana_anuncios (ya aplicada).
--
-- escanervibracional.com ahora tiene VERSIONES (energia, espejo,
-- decodificador) y cada visitante ve una sola: la de su etiqueta de anuncio
-- (?a=) según un mapa, o la versión por defecto. Zak elige las dos cosas en
-- Motor → Campaña → «Página de destino», y el Motor muestra visitas, toques a
-- la tienda y porcentaje POR VERSIÓN.
--
-- Piezas:
--   1. campana_eventos.version — qué versión vio la persona en ese evento.
--      Los eventos viejos se rellenan: todo lo anterior al 2026-10-08 fue la
--      página de siempre (energia); desde la publicación de la versión espejo
--      (2026-10-08 08:07 UTC) las etiquetas espejo* la vieron a ella, y desde
--      la del decodificador (08:35 UTC) las decodificador*.
--   2. record_campana_evento — la misma puerta pública, ahora con p_version
--      (opcional: la página de antes, sin ella, sigue funcionando igual).
--   3. Los ajustes de la página en campana_ajustes: landing_defecto y
--      landing_mapa (JSON etiqueta → versión).
--   4. get_campana_landing — lectura PÚBLICA: el píxel, la versión por
--      defecto y el mapa, en una sola llamada (la usa /api/landing de la
--      página, con caché de 30 s). get_campana_pixel se queda igual.
--   5. Admin (solo service_role por el gateway admin-action, con la misma
--      revisión de administrador que la del píxel):
--        admin_campana_estado (ahora trae también los ajustes de la página)
--        admin_campana_set_landing · admin_campana_versiones

BEGIN;

-- ── 1. La versión de cada evento ──────────────────────────────────────

ALTER TABLE public.campana_eventos
    ADD COLUMN IF NOT EXISTS version text NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'campana_eventos_version_formato'
    ) THEN
        ALTER TABLE public.campana_eventos
            ADD CONSTRAINT campana_eventos_version_formato
            CHECK (version IS NULL OR version ~ '^[a-z0-9-]{1,30}$');
    END IF;
END
$$;

-- Relleno: antes de las versiones solo existía «energia». Desde que se
-- publicó la versión espejo (08:07 UTC), la página la mostraba a las
-- etiquetas espejo*, y desde la del decodificador (08:35 UTC) a las
-- decodificador*; todo lo demás, la de siempre. Los eventos que ya traen
-- versión no se tocan.
UPDATE public.campana_eventos
SET version = CASE
        WHEN etiqueta ~ '^espejo' AND created_at >= '2026-10-08 08:07:00+00' THEN 'espejo'
        WHEN etiqueta ~ '^decodificador' AND created_at >= '2026-10-08 08:35:00+00' THEN 'decodificador'
        ELSE 'energia'
    END
WHERE version IS NULL;

CREATE INDEX IF NOT EXISTS campana_eventos_version_idx
    ON public.campana_eventos (version, created_at);

-- ── 2. La puerta pública, con la versión ──────────────────────────────
-- Se quita la firma vieja de 5 parámetros para que no haya dos funciones con
-- el mismo nombre (PostgREST no sabría cuál llamar). La nueva acepta las
-- mismas llamadas de antes: p_version es opcional.

DROP FUNCTION IF EXISTS public.record_campana_evento(text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.record_campana_evento(
    p_etiqueta      text DEFAULT NULL,
    p_evento        text DEFAULT NULL,
    p_plataforma    text DEFAULT NULL,
    p_navegador_app text DEFAULT NULL,
    p_visitante     uuid DEFAULT NULL,
    p_version       text DEFAULT NULL
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
    v_version    text := lower(btrim(COALESCE(p_version, '')));
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
    -- guarda como orgánico. Igual con la versión.
    IF v_etiqueta !~ '^[a-z0-9-]{1,40}$' THEN
        v_etiqueta := NULL;
    END IF;
    IF v_version !~ '^[a-z0-9-]{1,30}$' THEN
        v_version := NULL;
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
    -- gente.
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

    INSERT INTO public.campana_eventos (etiqueta, evento, plataforma, navegador_app, visitante, version)
    VALUES (v_etiqueta, v_evento, v_plataforma, v_app, p_visitante, v_version);
END;
$$;

REVOKE ALL ON FUNCTION public.record_campana_evento(text, text, text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_campana_evento(text, text, text, text, uuid, text)
    TO anon, authenticated, service_role;

-- ── 3. Los ajustes de la página (valores de arranque) ─────────────────
-- Los mismos que trae la página como copia de respaldo.

INSERT INTO public.campana_ajustes (clave, valor, updated_at)
VALUES
    ('landing_defecto', 'energia', now()),
    ('landing_mapa', '{"espejo":"espejo","decodificador":"decodificador"}', now())
ON CONFLICT (clave) DO NOTHING;

-- ── 4. Lectura pública: píxel + versión por defecto + mapa ────────────
-- Devuelve {pixel, defecto, mapa}. Lo que no cumple el formato sale null.

CREATE OR REPLACE FUNCTION public.get_campana_landing()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pixel   text;
    v_defecto text;
    v_mapa_t  text;
    v_mapa    jsonb := NULL;
    v_limpio  jsonb := '{}'::jsonb;
    r         record;
BEGIN
    SELECT a.valor INTO v_pixel FROM public.campana_ajustes a
    WHERE a.clave = 'meta_pixel_id' AND a.valor ~ '^[0-9]{8,20}$';

    SELECT a.valor INTO v_defecto FROM public.campana_ajustes a
    WHERE a.clave = 'landing_defecto' AND a.valor ~ '^[a-z0-9-]{1,30}$';

    SELECT a.valor INTO v_mapa_t FROM public.campana_ajustes a
    WHERE a.clave = 'landing_mapa';

    IF v_mapa_t IS NOT NULL THEN
        BEGIN
            v_mapa := v_mapa_t::jsonb;
        EXCEPTION WHEN others THEN
            v_mapa := NULL;
        END;
    END IF;

    IF v_mapa IS NOT NULL AND jsonb_typeof(v_mapa) = 'object' THEN
        FOR r IN SELECT key, value FROM jsonb_each(v_mapa) LOOP
            IF r.key ~ '^[a-z0-9-]{1,40}$'
               AND jsonb_typeof(r.value) = 'string'
               AND (r.value #>> '{}') ~ '^[a-z0-9-]{1,30}$' THEN
                v_limpio := v_limpio || jsonb_build_object(r.key, r.value #>> '{}');
            END IF;
        END LOOP;
    ELSE
        v_limpio := NULL;
    END IF;

    RETURN json_build_object(
        'pixel',   v_pixel,
        'defecto', v_defecto,
        'mapa',    v_limpio
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_campana_landing() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_campana_landing()
    TO anon, authenticated, service_role;

-- ── 5a. Estado de la campaña (encabezado del panel), con la página ────

CREATE OR REPLACE FUNCTION public.admin_campana_estado(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mapa jsonb := NULL;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    BEGIN
        SELECT a.valor::jsonb INTO v_mapa FROM public.campana_ajustes a
        WHERE a.clave = 'landing_mapa';
    EXCEPTION WHEN others THEN
        v_mapa := NULL;
    END;

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
        'hoy', to_char((now() AT TIME ZONE 'America/Cancun')::date, 'YYYY-MM-DD'),
        'landing_defecto', (
            SELECT a.valor FROM public.campana_ajustes a
            WHERE a.clave = 'landing_defecto'
        ),
        'landing_mapa', v_mapa,
        'landing_actualizado', (
            SELECT max(a.updated_at) FROM public.campana_ajustes a
            WHERE a.clave IN ('landing_defecto', 'landing_mapa')
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_estado(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_estado(text) TO service_role;

-- ── 5b. Guardar la página: versión por defecto y/o mapa ───────────────
-- p_defecto NULL = no se toca. p_mapa NULL = no se toca; un objeto JSON
-- etiqueta → versión lo REEMPLAZA entero (hasta 60 etiquetas). Devuelve lo
-- que quedó guardado: {defecto, mapa}.

CREATE OR REPLACE FUNCTION public.admin_campana_set_landing(
    p_defecto        text,
    p_mapa           jsonb,
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_defecto text := NULLIF(lower(btrim(COALESCE(p_defecto, ''))), '');
    v_limpio  jsonb := '{}'::jsonb;
    v_n       int := 0;
    r         record;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_defecto IS NOT NULL THEN
        IF v_defecto !~ '^[a-z0-9-]{1,30}$' THEN
            RAISE EXCEPTION 'version_invalida';
        END IF;
        INSERT INTO public.campana_ajustes (clave, valor, updated_at)
        VALUES ('landing_defecto', v_defecto, now())
        ON CONFLICT (clave) DO UPDATE
            SET valor = EXCLUDED.valor,
                updated_at = now();
    END IF;

    IF p_mapa IS NOT NULL THEN
        IF jsonb_typeof(p_mapa) <> 'object' THEN
            RAISE EXCEPTION 'mapa_invalido';
        END IF;
        FOR r IN SELECT key, value FROM jsonb_each(p_mapa) LOOP
            v_n := v_n + 1;
            IF v_n > 60 THEN
                RAISE EXCEPTION 'mapa_demasiado_grande';
            END IF;
            IF r.key !~ '^[a-z0-9-]{1,40}$'
               OR jsonb_typeof(r.value) <> 'string'
               OR (r.value #>> '{}') !~ '^[a-z0-9-]{1,30}$' THEN
                RAISE EXCEPTION 'mapa_invalido';
            END IF;
            v_limpio := v_limpio || jsonb_build_object(r.key, r.value #>> '{}');
        END LOOP;
        INSERT INTO public.campana_ajustes (clave, valor, updated_at)
        VALUES ('landing_mapa', v_limpio::text, now())
        ON CONFLICT (clave) DO UPDATE
            SET valor = EXCLUDED.valor,
                updated_at = now();
    END IF;

    RETURN json_build_object(
        'defecto', (SELECT a.valor FROM public.campana_ajustes a WHERE a.clave = 'landing_defecto'),
        'mapa',    (SELECT a.valor::jsonb FROM public.campana_ajustes a WHERE a.clave = 'landing_mapa')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_set_landing(text, jsonb, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_set_landing(text, jsonb, text) TO service_role;

-- ── 5c. Visitas, toques y porcentaje por versión en un rango ──────────
-- Un renglón por versión (las que tuvieron eventos en el rango), contando
-- PERSONAS distintas en todo el rango (no la suma de los días):
--   version            'energia' · 'espejo' · … · 'sin_version'
--   visitas            personas que abrieron esa versión
--   visitas_anuncio    ídem, con etiqueta de anuncio
--   toques             personas que tocaron App Store o Google Play en esa versión
--   toques_anuncio     ídem, con etiqueta de anuncio
--   toques_ios / toques_android / toques_mac / toques_web
--   por_etiqueta       [{etiqueta, visitas, toques}] ('' = sin anuncio)

CREATE OR REPLACE FUNCTION public.admin_campana_versiones(
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
    IF v_hasta - v_desde > 119 THEN
        v_desde := v_hasta - 119;
    END IF;

    v_inicio := v_desde::timestamp AT TIME ZONE 'America/Cancun';
    v_fin    := (v_hasta + 1)::timestamp AT TIME ZONE 'America/Cancun';

    WITH ev AS (
        SELECT COALESCE(e.version, 'sin_version') AS version,
               COALESCE(e.etiqueta, '') AS etiqueta,
               e.evento, e.visitante
        FROM public.campana_eventos e
        WHERE e.created_at >= v_inicio AND e.created_at < v_fin
    ),
    por_version AS (
        SELECT ev.version,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'visita')::int AS visitas,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'visita' AND ev.etiqueta <> '')::int AS visitas_anuncio,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento IN ('tienda_ios', 'tienda_android'))::int AS toques,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento IN ('tienda_ios', 'tienda_android') AND ev.etiqueta <> '')::int AS toques_anuncio,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_ios')::int AS toques_ios,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_android')::int AS toques_android,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'tienda_mac')::int AS toques_mac,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'web')::int AS toques_web
        FROM ev
        GROUP BY ev.version
    ),
    por_etiqueta AS (
        SELECT ev.version, ev.etiqueta,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento = 'visita')::int AS visitas,
            count(DISTINCT ev.visitante) FILTER (WHERE ev.evento IN ('tienda_ios', 'tienda_android'))::int AS toques
        FROM ev
        GROUP BY ev.version, ev.etiqueta
    )
    SELECT COALESCE(json_agg(json_build_object(
        'version',         pv.version,
        'visitas',         pv.visitas,
        'visitas_anuncio', pv.visitas_anuncio,
        'toques',          pv.toques,
        'toques_anuncio',  pv.toques_anuncio,
        'toques_ios',      pv.toques_ios,
        'toques_android',  pv.toques_android,
        'toques_mac',      pv.toques_mac,
        'toques_web',      pv.toques_web,
        'por_etiqueta', (
            SELECT COALESCE(json_agg(json_build_object(
                'etiqueta', pe.etiqueta, 'visitas', pe.visitas, 'toques', pe.toques
            ) ORDER BY pe.visitas DESC, pe.etiqueta), '[]'::json)
            FROM por_etiqueta pe
            WHERE pe.version = pv.version
        )
    ) ORDER BY pv.visitas DESC, pv.version), '[]'::json)
    INTO v_out
    FROM por_version pv;

    RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_campana_versiones(date, date, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campana_versiones(date, date, text) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
