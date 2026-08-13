-- Red Solar Viva · CIUDAD DE LUZ — juego idle contemplativo (Holoteca → Simuladores)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El Tripulante GESTA UN COSMOS: vivir coherente (Fotones de los rituales)
-- imprime MASA; siembra estrellas con una INTENCIÓN nombrada (mapeada a 1 de
-- los 6 pilares); las nutre hasta densidad crítica; COLAPSAN en luz propia y
-- trazan su primera ÓRBITA que gira sola para siempre y gotea LUZ VIVA pasiva.
-- masa→gravedad→órbita = consistencia→activo→ingreso pasivo.
--
-- 🜂 REGLA DE ORO (blindada): Ciudad de Luz JAMÁS escribe en el ledger de
-- Fotones/Maestría (daily_checkins) ni en la bolsa gastable de la Cámara de
-- Cristalización (user_crystal_owned). El único contacto con los Fotones reales
-- es de UN SOLO SENTIDO y SOLO LECTURA: la OFRENDA diaria LEE today_fotones e
-- IMPRIME masa interna (delta-only, idempotente por día). Por construcción es
-- IMPOSIBLE subir el Avatar/Maestría o comprar cristales jugando idle, e
-- IMPOSIBLE que sembrar de-evolucione el avatar (no resta Fotones).
--
-- Idle SERVER-AUTHORITATIVE (anti-trampa de reloj): la luz pasiva se computa
-- por delta de timestamp en el servidor (NOW()), nunca en el cliente. save
-- acepta solo MUTACIONES tipadas (ofrendar/sembrar/nutrir/colapsar/bitacora),
-- nunca totales del cliente. Las RPC del Tripulante van por el gateway
-- user-action (inyecta el clerk_user_id verificado del token).
--
-- Economía DB-driven (ciudad_luz_config + ciudad_luz_catalog): Zak ajusta
-- costos/curvas/intenciones sin build (SQL Editor o Motor a futuro).

-- ════════════════════════════════════════════════════════════════════
-- TABLAS
-- ════════════════════════════════════════════════════════════════════

-- Estado del cosmos por Tripulante (1 fila/usuario).
CREATE TABLE IF NOT EXISTS public.ciudad_luz_estado (
    clerk_user_id          text PRIMARY KEY,
    masa                   numeric NOT NULL DEFAULT 0,   -- capital de trabajo (Ofrenda)
    luz_viva               numeric NOT NULL DEFAULT 0,   -- ingreso pasivo (órbitas)
    estrellas              jsonb   NOT NULL DEFAULT '[]'::jsonb,
    bitacora               jsonb   NOT NULL DEFAULT '[]'::jsonb,
    last_tick              timestamptz NOT NULL DEFAULT now(),
    ofrenda_dia            date,
    fotones_ofrendados_hoy integer NOT NULL DEFAULT 0,
    genesis_claimed        boolean NOT NULL DEFAULT false,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Parámetros económicos DB-driven (editables sin build).
CREATE TABLE IF NOT EXISTS public.ciudad_luz_config (
    param text PRIMARY KEY,
    val   numeric NOT NULL
);
INSERT INTO public.ciudad_luz_config (param, val) VALUES
    ('offering_rate',     10),    -- 1 Fotón ofrendado = N de MASA
    ('seed_cost_masa',    100),   -- sembrar una estrella nueva (MASA)
    ('nurture_cost_luz',  30),    -- nutrir un paso (LUZ VIVA)
    ('nurture_step',      0.2),   -- densidad por paso de nutrición
    ('collapse_density',  1.0),   -- umbral de colapso
    ('orbit_rate',        8),     -- LUZ VIVA / hora por estrella colapsada
    ('genesis_masa',      100),   -- regalo de génesis (MASA, NO Fotones)
    ('genesis_luz',       90),    -- regalo de génesis (LUZ VIVA)
    ('genesis_density',   0.8),   -- la 1ª estrella nace cerca del colapso (WOW sesión 1)
    ('cap_offline_hours', 168),   -- tope de acumulación offline (regalo, nunca pérdida)
    ('max_stars',         60)
ON CONFLICT (param) DO NOTHING;

-- Catálogo de contenido DB-driven (intenciones curadas + geometrías + tipos).
CREATE TABLE IF NOT EXISTS public.ciudad_luz_catalog (
    item_key        text PRIMARY KEY,
    kind            text NOT NULL,        -- 'intencion' | 'geometria' | 'star_type'
    label           text NOT NULL,
    descripcion     text,
    params          jsonb NOT NULL DEFAULT '{}'::jsonb,
    requires_member boolean NOT NULL DEFAULT false,   -- premium SOLO estético (rate idéntico)
    active          boolean NOT NULL DEFAULT true,
    sort_order      integer NOT NULL DEFAULT 0
);
INSERT INTO public.ciudad_luz_catalog (item_key, kind, label, params, requires_member, sort_order) VALUES
    -- Intenciones curadas por pilar (en presente, primera persona). params.pilar
    ('int:fis:1','intencion','Mi cuerpo es ligero y enciende al despertar','{"pilar":"fisico"}',false,1),
    ('int:fis:2','intencion','Me muevo con energía y descanso profundo','{"pilar":"fisico"}',false,2),
    ('int:fis:3','intencion','Cada célula vibra en salud','{"pilar":"fisico"}',false,3),
    ('int:men:1','intencion','Mi mente es clara y enfocada','{"pilar":"mental"}',false,1),
    ('int:men:2','intencion','Elijo mis pensamientos con soberanía','{"pilar":"mental"}',false,2),
    ('int:men:3','intencion','La calma es mi estado base','{"pilar":"mental"}',false,3),
    ('int:emo:1','intencion','Siento y suelto con libertad','{"pilar":"emocional"}',false,1),
    ('int:emo:2','intencion','Mi paz no depende de nadie','{"pilar":"emocional"}',false,2),
    ('int:emo:3','intencion','Transmuto el dolor en luz','{"pilar":"emocional"}',false,3),
    ('int:fin:1','intencion','Recibo abundancia con facilidad','{"pilar":"financiero"}',false,1),
    ('int:fin:2','intencion','El dinero fluye hacia mí sin esfuerzo','{"pilar":"financiero"}',false,2),
    ('int:fin:3','intencion','Soy un imán para la prosperidad','{"pilar":"financiero"}',false,3),
    ('int:vec:1','intencion','Vivo mis sueños, no los de otros','{"pilar":"vector"}',false,1),
    ('int:vec:2','intencion','Avanzo hacia mi propósito cada día','{"pilar":"vector"}',false,2),
    ('int:vec:3','intencion','Mi camino se ilumina al caminarlo','{"pilar":"vector"}',false,3),
    ('int:orb:1','intencion','Mis vínculos me expanden','{"pilar":"orbita"}',false,1),
    ('int:orb:2','intencion','Atraigo relaciones de alta frecuencia','{"pilar":"orbita"}',false,2),
    ('int:orb:3','intencion','Doy y recibo amor en equilibrio','{"pilar":"orbita"}',false,3),
    -- Geometrías de órbita (SOLO estética; rate económico idéntico).
    ('geo:circular','geometria','Órbita circular','{"skin":"circular"}',false,1),
    ('geo:aurea','geometria','Espiral áurea','{"skin":"aurea"}',true,2),
    -- Tipo de estrella base (el slice usa uno; crece DB-driven).
    ('star:semilla','star_type','Semilla de luz','{"hue_by_pilar":true}',false,1)
ON CONFLICT (item_key) DO NOTHING;

ALTER TABLE public.ciudad_luz_estado  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciudad_luz_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciudad_luz_catalog ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- HELPERS internos (SECURITY DEFINER; los llaman las RPCs, no el cliente)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._cdl_cfg(p_param text, p_default numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE((SELECT val FROM ciudad_luz_config WHERE param = p_param), p_default);
$$;

-- Asegura la fila del Tripulante; en el primer acceso aplica el REGALO DE
-- GÉNESIS (MASA + LUZ VIVA internas, NUNCA Fotones). Idempotente.
CREATE OR REPLACE FUNCTION public._cdl_ensure(p_clerk_user_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO ciudad_luz_estado (clerk_user_id, masa, luz_viva, genesis_claimed, last_tick)
    VALUES (
        p_clerk_user_id,
        _cdl_cfg('genesis_masa', 100),
        _cdl_cfg('genesis_luz', 90),
        true,
        now()
    )
    ON CONFLICT (clerk_user_id) DO NOTHING;
END;
$$;

-- Acumula la luz pasiva por DELTA de tiempo en el SERVIDOR (anti-trampa de
-- reloj). rate = suma del goteo de las estrellas colapsadas. El tiempo offline
-- se capa generosamente (regalo, nunca pérdida). Fija last_tick = now().
CREATE OR REPLACE FUNCTION public._cdl_accrue(p_clerk_user_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r           ciudad_luz_estado%ROWTYPE;
    rate        numeric;
    elapsed_sec numeric;
    cap_sec     numeric;
    gain        numeric;
BEGIN
    SELECT * INTO r FROM ciudad_luz_estado WHERE clerk_user_id = p_clerk_user_id;
    IF NOT FOUND THEN RETURN; END IF;

    SELECT COALESCE(SUM((s->>'rate')::numeric), 0) INTO rate
    FROM jsonb_array_elements(r.estrellas) s
    WHERE COALESCE((s->>'collapsed')::boolean, false);

    IF rate <= 0 THEN
        UPDATE ciudad_luz_estado SET last_tick = now() WHERE clerk_user_id = p_clerk_user_id;
        RETURN;
    END IF;

    elapsed_sec := GREATEST(0, EXTRACT(EPOCH FROM (now() - r.last_tick)));
    cap_sec     := _cdl_cfg('cap_offline_hours', 168) * 3600;
    gain        := rate * LEAST(elapsed_sec, cap_sec) / 3600.0;

    UPDATE ciudad_luz_estado
       SET luz_viva = luz_viva + gain, last_tick = now()
     WHERE clerk_user_id = p_clerk_user_id;
END;
$$;

-- Construye el JSON de estado que consume el cliente (estado + Fotones de hoy
-- + config + catálogo). today_fotones se LEE de daily_checkins (jamás se muta).
CREATE OR REPLACE FUNCTION public._cdl_state_json(p_clerk_user_id text)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r      ciudad_luz_estado%ROWTYPE;
    today  date := (now() AT TIME ZONE 'America/Cancun')::date;
    tf     integer;
    ofr    integer;
BEGIN
    SELECT * INTO r FROM ciudad_luz_estado WHERE clerk_user_id = p_clerk_user_id;
    SELECT COALESCE(SUM(points), 0)::int INTO tf
    FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date = today;
    ofr := CASE WHEN r.ofrenda_dia = today THEN r.fotones_ofrendados_hoy ELSE 0 END;

    RETURN json_build_object(
        'masa', r.masa,
        'luz_viva', r.luz_viva,
        'estrellas', r.estrellas,
        'bitacora', r.bitacora,
        'estrellas_count', jsonb_array_length(r.estrellas),
        'today_fotones', tf,
        'fotones_ofrendados_hoy', ofr,
        'ofrenda_disponible', GREATEST(0, tf - ofr),
        'genesis_claimed', r.genesis_claimed,
        'config', (SELECT json_object_agg(param, val) FROM ciudad_luz_config),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label,
                'descripcion', descripcion, 'params', params,
                'requires_member', requires_member, 'sort_order', sort_order
            ) ORDER BY kind, sort_order)
            FROM ciudad_luz_catalog WHERE active
        ), '[]'::json),
        'server_now', extract(epoch FROM now())
    );
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPC del Tripulante (por gateway user-action: inyecta p_clerk_user_id)
-- ════════════════════════════════════════════════════════════════════

-- Cargar el cosmos: asegura fila (+ génesis), acumula la luz pasiva offline,
-- devuelve el estado completo.
CREATE OR REPLACE FUNCTION public.get_ciudad_luz(p_clerk_user_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM _cdl_ensure(p_clerk_user_id);
    PERFORM _cdl_accrue(p_clerk_user_id);
    RETURN _cdl_state_json(p_clerk_user_id);
END;
$$;

-- Aplicar UNA mutación server-authoritative. NUNCA acepta totales del cliente:
-- re-deriva el estado y valida costos contra la contabilidad interna.
--   p_action = 'offering' | 'seed' | 'nurture' | 'collapse' | 'bitacora'
CREATE OR REPLACE FUNCTION public.save_ciudad_luz(
    p_clerk_user_id text,
    p_action        text,
    p_payload       jsonb DEFAULT '{}'::jsonb
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r          ciudad_luz_estado%ROWTYPE;
    today      date := (now() AT TIME ZONE 'America/Cancun')::date;
    tf         integer;
    v_prev_ofr integer;
    v_delta    integer;
    v_cost     numeric;
    v_id       text;
    v_star     jsonb;
    v_new      jsonb;
    v_density  numeric;
    v_step     numeric;
    v_collapse numeric;
    v_rate     numeric;
    v_maxstars integer;
BEGIN
    PERFORM _cdl_ensure(p_clerk_user_id);
    PERFORM _cdl_accrue(p_clerk_user_id);
    SELECT * INTO r FROM ciudad_luz_estado WHERE clerk_user_id = p_clerk_user_id FOR UPDATE;

    IF p_action = 'offering' THEN
        -- Imprime MASA por los Fotones de hoy AÚN no ofrendados (delta-only,
        -- idempotente por día). LEE today_fotones; NUNCA escribe en daily_checkins.
        SELECT COALESCE(SUM(points), 0)::int INTO tf
        FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date = today;
        v_prev_ofr := CASE WHEN r.ofrenda_dia = today THEN r.fotones_ofrendados_hoy ELSE 0 END;
        v_delta    := GREATEST(0, tf - v_prev_ofr);
        UPDATE ciudad_luz_estado
           SET masa = r.masa + v_delta * _cdl_cfg('offering_rate', 10),
               fotones_ofrendados_hoy = tf,
               ofrenda_dia = today,
               updated_at = now()
         WHERE clerk_user_id = p_clerk_user_id;

    ELSIF p_action = 'seed' THEN
        v_maxstars := _cdl_cfg('max_stars', 60)::int;
        IF jsonb_array_length(r.estrellas) >= v_maxstars THEN
            RETURN json_build_object('error', 'max_stars');
        END IF;
        v_cost := _cdl_cfg('seed_cost_masa', 100);
        IF r.masa < v_cost THEN
            RETURN json_build_object('error', 'insufficient_masa');
        END IF;
        -- La 1ª estrella de la vida nace cerca del colapso → primer COLAPSO
        -- garantizado en la sesión 1 (Momento Cero).
        v_density := CASE WHEN jsonb_array_length(r.estrellas) = 0
                          THEN _cdl_cfg('genesis_density', 0.8) ELSE 0 END;
        v_id := COALESCE(NULLIF(p_payload->>'id', ''), md5(random()::text || clock_timestamp()::text));
        v_star := jsonb_build_object(
            'id', v_id,
            'x', LEAST(965, GREATEST(35, COALESCE((p_payload->>'x')::numeric, 500))),
            'y', LEAST(965, GREATEST(35, COALESCE((p_payload->>'y')::numeric, 500))),
            'pilar', COALESCE(NULLIF(p_payload->>'pilar', ''), 'vector'),
            'intencion', LEFT(COALESCE(p_payload->>'intencion', ''), 160),
            'geometria', COALESCE(NULLIF(p_payload->>'geometria', ''), 'geo:circular'),
            'density', v_density,
            'collapsed', false,
            'rate', 0,
            'born', extract(epoch FROM now())
        );
        UPDATE ciudad_luz_estado
           SET masa = r.masa - v_cost,
               estrellas = r.estrellas || jsonb_build_array(v_star),
               updated_at = now()
         WHERE clerk_user_id = p_clerk_user_id;

    ELSIF p_action = 'nurture' THEN
        v_id       := p_payload->>'id';
        v_step     := _cdl_cfg('nurture_step', 0.2);
        v_collapse := _cdl_cfg('collapse_density', 1.0);
        v_cost     := _cdl_cfg('nurture_cost_luz', 30);
        SELECT s INTO v_star FROM jsonb_array_elements(r.estrellas) s
         WHERE s->>'id' = v_id AND NOT COALESCE((s->>'collapsed')::boolean, false);
        IF v_star IS NULL THEN RETURN json_build_object('error', 'star_not_found'); END IF;
        IF r.luz_viva < v_cost THEN RETURN json_build_object('error', 'insufficient_luz'); END IF;
        v_density := LEAST(v_collapse, COALESCE((v_star->>'density')::numeric, 0) + v_step);
        SELECT jsonb_agg(
            CASE WHEN s->>'id' = v_id THEN s || jsonb_build_object('density', v_density) ELSE s END
        ) INTO v_new FROM jsonb_array_elements(r.estrellas) s;
        UPDATE ciudad_luz_estado
           SET luz_viva = r.luz_viva - v_cost, estrellas = v_new, updated_at = now()
         WHERE clerk_user_id = p_clerk_user_id;

    ELSIF p_action = 'collapse' THEN
        v_id       := p_payload->>'id';
        v_collapse := _cdl_cfg('collapse_density', 1.0);
        v_rate     := _cdl_cfg('orbit_rate', 8);
        SELECT s INTO v_star FROM jsonb_array_elements(r.estrellas) s
         WHERE s->>'id' = v_id AND NOT COALESCE((s->>'collapsed')::boolean, false);
        IF v_star IS NULL THEN RETURN json_build_object('error', 'star_not_found'); END IF;
        IF COALESCE((v_star->>'density')::numeric, 0) < v_collapse THEN
            RETURN json_build_object('error', 'not_critical');
        END IF;
        SELECT jsonb_agg(
            CASE WHEN s->>'id' = v_id
                 THEN s || jsonb_build_object('collapsed', true, 'rate', v_rate,
                                              'collapsed_at', extract(epoch FROM now()))
                 ELSE s END
        ) INTO v_new FROM jsonb_array_elements(r.estrellas) s;
        UPDATE ciudad_luz_estado
           SET estrellas = v_new, updated_at = now()
         WHERE clerk_user_id = p_clerk_user_id;

    ELSIF p_action = 'bitacora' THEN
        -- Registro de manifestación: NO afecta economía ni puntaje (reflexivo).
        UPDATE ciudad_luz_estado
           SET bitacora = r.bitacora || jsonb_build_array(jsonb_build_object(
                   'id',        COALESCE(p_payload->>'id', ''),
                   'intencion', LEFT(COALESCE(p_payload->>'intencion', ''), 160),
                   'pilar',     COALESCE(NULLIF(p_payload->>'pilar', ''), 'vector'),
                   'answer',    LEFT(COALESCE(p_payload->>'answer', ''), 20),
                   'days',      COALESCE((p_payload->>'days')::int, 0),
                   'at',        extract(epoch FROM now())
               )),
               updated_at = now()
         WHERE clerk_user_id = p_clerk_user_id;

    ELSE
        RETURN json_build_object('error', 'unknown_action');
    END IF;

    RETURN _cdl_state_json(p_clerk_user_id);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPC admin (por gateway admin-action) — Motor: economía + catálogo sin build
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_get_ciudad_luz(p_admin_clerk_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    RETURN json_build_object(
        'config', (SELECT json_object_agg(param, val) FROM ciudad_luz_config),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label,
                'descripcion', descripcion, 'params', params,
                'requires_member', requires_member, 'active', active, 'sort_order', sort_order
            ) ORDER BY kind, sort_order) FROM ciudad_luz_catalog
        ), '[]'::json)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_ciudad_luz_config(
    p_admin_clerk_id text, p_param text, p_val numeric
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    INSERT INTO ciudad_luz_config (param, val) VALUES (p_param, p_val)
    ON CONFLICT (param) DO UPDATE SET val = EXCLUDED.val;
    RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_ciudad_luz_item(
    p_admin_clerk_id text, p_item_key text, p_kind text, p_label text,
    p_descripcion text, p_params jsonb, p_requires_member boolean,
    p_active boolean, p_sort_order integer
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    INSERT INTO ciudad_luz_catalog (item_key, kind, label, descripcion, params, requires_member, active, sort_order)
    VALUES (
        p_item_key, COALESCE(p_kind, 'intencion'), LEFT(COALESCE(p_label, ''), 120),
        p_descripcion, COALESCE(p_params, '{}'::jsonb), COALESCE(p_requires_member, false),
        COALESCE(p_active, true), COALESCE(p_sort_order, 0)
    )
    ON CONFLICT (item_key) DO UPDATE SET
        kind = EXCLUDED.kind, label = EXCLUDED.label, descripcion = EXCLUDED.descripcion,
        params = EXCLUDED.params, requires_member = EXCLUDED.requires_member,
        active = EXCLUDED.active, sort_order = EXCLUDED.sort_order;
    RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_ciudad_luz_item(
    p_admin_clerk_id text, p_item_key text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM ciudad_luz_catalog WHERE item_key = p_item_key;
    RETURN json_build_object('ok', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS (el candado): REVOKE de PUBLIC/anon/authenticated, GRANT service_role.
-- Los helpers _cdl_* los ejecuta el owner dentro de las RPC DEFINER (no se exponen).
-- ════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public._cdl_cfg(text, numeric)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._cdl_ensure(text)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._cdl_accrue(text)            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._cdl_state_json(text)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ciudad_luz(text)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.save_ciudad_luz(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_ciudad_luz(text)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_ciudad_luz_config(text, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ciudad_luz_item(text, text, text, text, text, jsonb, boolean, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_ciudad_luz_item(text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_ciudad_luz(text)          TO service_role;
GRANT EXECUTE ON FUNCTION public.save_ciudad_luz(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_ciudad_luz(text)    TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_ciudad_luz_config(text, text, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_ciudad_luz_item(text, text, text, text, text, jsonb, boolean, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_ciudad_luz_item(text, text) TO service_role;
