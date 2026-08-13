-- Red Solar Viva · Cámara de Cristalización (sumidero de Fotones: tienda de
-- avatares + elementos) — COLUMNA VERTEBRAL ECONÓMICA
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Los Fotones dejan de ser solo un número: se vuelven MONEDA para desbloquear
-- avatares extra + elementos (auras, anillos, enjambres, sellos, alas) que se
-- equipan sobre el avatar. Decisiones de diseño (selladas con Zak 2026-06-20):
--   1) Elementos UNIVERSALES (sirven en los 3 avatares; se dibujan alrededor).
--   2) Avatar: el PRIMERO es gratis (elección con previsualización); cada
--      avatar extra se DESBLOQUEA una vez con Fotones y queda tuyo para siempre;
--      cambiar entre los TUYOS es gratis.
--   3) DOS contadores: "Maestría" = total de Fotones de por vida (SUM de
--      daily_checkins, INTOCABLE, manda la evolución del avatar) y "Fotones
--      disponibles" (bolsa gastable = Maestría − lo gastado). Gastar NUNCA baja
--      la evolución. La bolsa se DERIVA (no hay doble ledger que se desincronice).
--
-- Catálogo DB-driven → Zak edita ítems/precios/requisitos desde el Motor, sin
-- build. Seguridad: tablas RLS sin policies → solo vía RPCs SECURITY DEFINER;
-- las del Tripulante por el gateway user-action (inyecta el clerk_user_id
-- verificado), las admin por admin-action.

-- ════════════════════════════════════════════════════════════════════
-- TABLAS
-- ════════════════════════════════════════════════════════════════════

-- Catálogo de todo lo comprable (avatares + elementos). item_key namespaced
-- por kind: 'avatar:nova', 'aura:solar', 'ring:saturno', etc.
CREATE TABLE IF NOT EXISTS public.crystal_catalog (
    item_key        text PRIMARY KEY,
    kind            text NOT NULL,            -- 'avatar' | 'aura' | 'ring' | 'swarm' | 'sigil' | 'wings'
    label           text NOT NULL,
    descripcion     text DEFAULT '',
    price_fotones   integer NOT NULL DEFAULT 0,
    requires_stage  integer NOT NULL DEFAULT 0,   -- etapa mínima del avatar seleccionado (0 = sin req)
    requires_streak integer NOT NULL DEFAULT 0,   -- racha mínima (0 = sin req)
    params          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {palette, count, ...} para el render del elemento
    sort_order      integer NOT NULL DEFAULT 0,
    active          boolean NOT NULL DEFAULT true
);

-- Inventario: qué posee cada Tripulante + cuánto pagó (para derivar el gasto).
CREATE TABLE IF NOT EXISTS public.user_crystal_owned (
    clerk_user_id text NOT NULL,
    item_key      text NOT NULL,
    cost_paid     integer NOT NULL DEFAULT 0,
    acquired_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, item_key)
);
CREATE INDEX IF NOT EXISTS idx_user_crystal_owned_user ON public.user_crystal_owned (clerk_user_id);

-- Estado: avatar seleccionado + loadout de elementos equipados por ranura.
CREATE TABLE IF NOT EXISTS public.user_crystal_state (
    clerk_user_id   text PRIMARY KEY,
    selected_avatar text,                         -- 'nova'|'aurelia'|'prisma'; null hasta la 1ª elección
    equipped        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {aura, ring, swarm, sigil, wings} → item_key | null
    updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crystal_catalog     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_crystal_owned  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_crystal_state  ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- HELPERS internos (etapa del avatar + racha) — los llaman las RPCs SECURITY
-- DEFINER; revocados de anon.
-- ════════════════════════════════════════════════════════════════════

-- Índice de etapa (0..6) del avatar p_avatar_key para p_total Fotones, leyendo
-- los umbrales DB-driven de avatar_config (mismo criterio que el cliente).
CREATE OR REPLACE FUNCTION public.crystal_stage_index(p_avatar_key text, p_total integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    th  jsonb;
    idx integer := 0;
    r   record;
BEGIN
    SELECT thresholds INTO th FROM avatar_config WHERE avatar_key = p_avatar_key;
    IF th IS NULL OR jsonb_typeof(th) <> 'array' THEN
        RETURN 0;
    END IF;
    FOR r IN
        SELECT (e.value #>> '{}')::numeric AS val, (e.ordinality - 1) AS ix
        FROM jsonb_array_elements(th) WITH ORDINALITY e
    LOOP
        IF p_total >= r.val THEN
            idx := r.ix::int;
        END IF;
    END LOOP;
    RETURN idx;
END;
$$;

-- Racha (días consecutivos con ≥1 check, terminando hoy o ayer). La fila
-- sentinela de admin (fecha 2000) no es contigua → no afecta.
CREATE OR REPLACE FUNCTION public.crystal_user_streak(p_clerk_user_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d   date := (now() AT TIME ZONE 'America/Cancun')::date;
    cur date;
    s   integer := 0;
BEGIN
    cur := d;
    IF NOT EXISTS (SELECT 1 FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur) THEN
        cur := cur - 1;
    END IF;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur);
        s := s + 1;
        cur := cur - 1;
    END LOOP;
    RETURN s;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs DEL TRIPULANTE  (ruteadas por user-action; inyecta clerk_user_id)
-- ════════════════════════════════════════════════════════════════════

-- Snapshot completo de la Cámara: catálogo + lo que posee + equipado + saldos.
CREATE OR REPLACE FUNCTION public.get_crystal_chamber(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total int; spent int; sel text; eq jsonb; stg int; strk int; result json;
BEGIN
    SELECT COALESCE(SUM(points), 0)::int INTO total
    FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id;
    SELECT COALESCE(SUM(cost_paid), 0)::int INTO spent
    FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id;
    SELECT selected_avatar, equipped INTO sel, eq
    FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    stg := CASE WHEN sel IS NULL THEN 0 ELSE crystal_stage_index(sel, total) END;
    strk := crystal_user_streak(p_clerk_user_id);

    SELECT json_build_object(
        'selected_avatar', sel,
        'equipped', COALESCE(eq, '{}'::jsonb),
        'total_fotones', total,
        'spent', spent,
        'spendable', GREATEST(0, total - spent),
        'current_stage', stg,
        'streak', strk,
        'owned', COALESCE((
            SELECT json_agg(item_key ORDER BY item_key)
            FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key,
                'kind', kind,
                'label', label,
                'descripcion', descripcion,
                'price', price_fotones,
                'requires_stage', requires_stage,
                'requires_streak', requires_streak,
                'params', params,
                'sort_order', sort_order
            ) ORDER BY kind, sort_order, label)
            FROM crystal_catalog WHERE active
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- Selecciona un avatar. El PRIMERO (no posee ninguno) es gratis. Si ya posee
-- avatares pero NO este → debe comprarlo (purchase_crystal_item). Si ya lo
-- posee → solo lo selecciona (cambio libre).
CREATE OR REPLACE FUNCTION public.select_avatar(p_clerk_user_id text, p_avatar_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    k         text := LEFT(TRIM(COALESCE(p_avatar_key, '')), 40);
    item      text := 'avatar:' || k;
    owns_any  boolean;
    owns_this boolean;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM crystal_catalog WHERE item_key = item AND kind = 'avatar' AND active) THEN
        RETURN json_build_object('error', 'unknown_avatar');
    END IF;

    SELECT EXISTS (SELECT 1 FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id AND item_key LIKE 'avatar:%')
        INTO owns_any;
    SELECT EXISTS (SELECT 1 FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id AND item_key = item)
        INTO owns_this;

    IF NOT owns_this THEN
        IF owns_any THEN
            RETURN json_build_object('error', 'must_purchase');
        END IF;
        INSERT INTO user_crystal_owned (clerk_user_id, item_key, cost_paid)
        VALUES (p_clerk_user_id, item, 0)
        ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO user_crystal_state (clerk_user_id, selected_avatar, equipped, updated_at)
    VALUES (p_clerk_user_id, k, '{}'::jsonb, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET selected_avatar = EXCLUDED.selected_avatar, updated_at = now();

    RETURN json_build_object('ok', true, 'selected_avatar', k);
END;
$$;

-- Compra un ítem (avatar extra o elemento). Valida: existe+activo, no
-- duplicado, requisitos de etapa/racha, saldo suficiente. Si es avatar, lo
-- autoselecciona. NO toca daily_checkins → la evolución (Maestría) no baja.
CREATE OR REPLACE FUNCTION public.purchase_crystal_item(p_clerk_user_id text, p_item_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    it    crystal_catalog%ROWTYPE;
    total int; spent int; spendable int; sel text; stg int; strk int; av text;
BEGIN
    SELECT * INTO it FROM crystal_catalog WHERE item_key = p_item_key AND active;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'unknown_item');
    END IF;
    IF EXISTS (SELECT 1 FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id AND item_key = p_item_key) THEN
        RETURN json_build_object('error', 'already_owned');
    END IF;

    SELECT COALESCE(SUM(points), 0)::int INTO total
    FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id;

    SELECT selected_avatar INTO sel FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    stg := CASE WHEN sel IS NULL THEN 0 ELSE crystal_stage_index(sel, total) END;
    strk := crystal_user_streak(p_clerk_user_id);
    IF COALESCE(it.requires_stage, 0) > stg THEN
        RETURN json_build_object('error', 'requires_stage', 'need', it.requires_stage);
    END IF;
    IF COALESCE(it.requires_streak, 0) > strk THEN
        RETURN json_build_object('error', 'requires_streak', 'need', it.requires_streak);
    END IF;

    SELECT COALESCE(SUM(cost_paid), 0)::int INTO spent
    FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id;
    spendable := total - spent;
    IF spendable < COALESCE(it.price_fotones, 0) THEN
        RETURN json_build_object('error', 'insufficient', 'need', it.price_fotones, 'have', spendable);
    END IF;

    INSERT INTO user_crystal_owned (clerk_user_id, item_key, cost_paid)
    VALUES (p_clerk_user_id, p_item_key, COALESCE(it.price_fotones, 0));

    IF it.kind = 'avatar' THEN
        av := regexp_replace(p_item_key, '^avatar:', '');
        INSERT INTO user_crystal_state (clerk_user_id, selected_avatar, equipped, updated_at)
        VALUES (p_clerk_user_id, av, '{}'::jsonb, now())
        ON CONFLICT (clerk_user_id) DO UPDATE
            SET selected_avatar = EXCLUDED.selected_avatar, updated_at = now();
    END IF;

    RETURN json_build_object(
        'ok', true,
        'item_key', p_item_key,
        'spendable', GREATEST(0, total - spent - COALESCE(it.price_fotones, 0))
    );
END;
$$;

-- Equipa/quita un elemento en su ranura (aura/ring/swarm/sigil/wings).
-- p_item_key NULL/'' = quitar. Debe poseerlo y el kind debe coincidir con la ranura.
CREATE OR REPLACE FUNCTION public.equip_crystal_element(
    p_clerk_user_id text,
    p_slot          text,
    p_item_key      text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    k  text;
    eq jsonb;
    clearing boolean := (p_item_key IS NULL OR length(trim(p_item_key)) = 0);
BEGIN
    IF p_slot NOT IN ('aura', 'ring', 'swarm', 'sigil', 'wings') THEN
        RETURN json_build_object('error', 'bad_slot');
    END IF;

    IF NOT clearing THEN
        SELECT kind INTO k FROM crystal_catalog WHERE item_key = p_item_key AND active;
        IF k IS NULL OR k <> p_slot THEN
            RETURN json_build_object('error', 'bad_item');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id AND item_key = p_item_key) THEN
            RETURN json_build_object('error', 'not_owned');
        END IF;
    END IF;

    INSERT INTO user_crystal_state (clerk_user_id, equipped, updated_at)
    VALUES (
        p_clerk_user_id,
        jsonb_build_object(p_slot, CASE WHEN clearing THEN NULL ELSE p_item_key END),
        now()
    )
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET equipped = (
                COALESCE(user_crystal_state.equipped, '{}'::jsonb)
                || jsonb_build_object(p_slot, CASE WHEN clearing THEN NULL ELSE p_item_key END)
            ),
            updated_at = now();

    SELECT equipped INTO eq FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('ok', true, 'equipped', COALESCE(eq, '{}'::jsonb));
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN — editor del catálogo (Motor → "Cristalización")
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_crystal_catalog(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    SELECT COALESCE(json_agg(json_build_object(
        'item_key', item_key, 'kind', kind, 'label', label, 'descripcion', descripcion,
        'price', price_fotones, 'requires_stage', requires_stage, 'requires_streak', requires_streak,
        'params', params, 'sort_order', sort_order, 'active', active
    ) ORDER BY kind, sort_order, label), '[]'::json)
    INTO result FROM crystal_catalog;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_crystal_item(
    p_admin_clerk_id text,
    p_item_key       text,
    p_kind           text,
    p_label          text,
    p_descripcion    text,
    p_price          integer,
    p_requires_stage integer,
    p_requires_streak integer,
    p_params         jsonb,
    p_sort_order     integer,
    p_active         boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  crystal_catalog%ROWTYPE;
    ik text := LEFT(TRIM(COALESCE(p_item_key, '')), 80);
    kd text := LEFT(TRIM(COALESCE(p_kind, '')), 20);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF LENGTH(ik) = 0 THEN RETURN json_build_object('error', 'empty_key'); END IF;
    IF kd NOT IN ('avatar','aura','ring','swarm','sigil','wings') THEN
        RETURN json_build_object('error', 'bad_kind');
    END IF;

    INSERT INTO crystal_catalog (item_key, kind, label, descripcion, price_fotones,
        requires_stage, requires_streak, params, sort_order, active)
    VALUES (
        ik, kd,
        COALESCE(NULLIF(TRIM(p_label), ''), ik),
        COALESCE(p_descripcion, ''),
        GREATEST(0, COALESCE(p_price, 0)),
        GREATEST(0, COALESCE(p_requires_stage, 0)),
        GREATEST(0, COALESCE(p_requires_streak, 0)),
        COALESCE(p_params, '{}'::jsonb),
        COALESCE(p_sort_order, 0),
        COALESCE(p_active, true)
    )
    ON CONFLICT (item_key) DO UPDATE
        SET kind            = kd,
            label           = COALESCE(NULLIF(TRIM(p_label), ''), crystal_catalog.label),
            descripcion     = COALESCE(p_descripcion, crystal_catalog.descripcion),
            price_fotones   = GREATEST(0, COALESCE(p_price, crystal_catalog.price_fotones)),
            requires_stage  = GREATEST(0, COALESCE(p_requires_stage, crystal_catalog.requires_stage)),
            requires_streak = GREATEST(0, COALESCE(p_requires_streak, crystal_catalog.requires_streak)),
            params          = COALESCE(p_params, crystal_catalog.params),
            sort_order      = COALESCE(p_sort_order, crystal_catalog.sort_order),
            active          = COALESCE(p_active, crystal_catalog.active)
    RETURNING * INTO r;

    RETURN json_build_object(
        'item_key', r.item_key, 'kind', r.kind, 'label', r.label, 'descripcion', r.descripcion,
        'price', r.price_fotones, 'requires_stage', r.requires_stage, 'requires_streak', r.requires_streak,
        'params', r.params, 'sort_order', r.sort_order, 'active', r.active
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_crystal_item(
    p_admin_clerk_id text,
    p_item_key       text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM crystal_catalog WHERE item_key = p_item_key;
    RETURN json_build_object('deleted', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- SEED del catálogo (idempotente — NO pisa precios que Zak ajuste luego).
-- 3 avatares (1º gratis, extras 1500) + 5 ranuras de elementos con variantes,
-- algunas gated por etapa/racha ("se ganan con constancia, no con dinero").
-- ════════════════════════════════════════════════════════════════════
INSERT INTO public.crystal_catalog (item_key, kind, label, descripcion, price_fotones, requires_stage, requires_streak, params, sort_order) VALUES
    -- Avatares (el primero que el Tripulante elige es gratis; estos precios son para DESBLOQUEAR los extras)
    ('avatar:nova',    'avatar', 'Nova Semilla', 'Tu estrella personal que evoluciona de chispa a faro.',                 1500, 0, 0, '{}'::jsonb, 1),
    ('avatar:aurelia', 'avatar', 'Aurelia',      'Tu firma sin cuerpo: un campo toroidal de luz que circula.',           1500, 0, 0, '{}'::jsonb, 2),
    ('avatar:prisma',  'avatar', 'Prisma',       'El cristal que se faceta contigo y refracta el cosmos.',                1500, 0, 0, '{}'::jsonb, 3),
    -- Auras (paleta envolvente que respira)
    ('aura:solar',     'aura',  'Aura Solar',          'Un halo dorado que respira a tu alrededor.',                       400,  0, 0, '{"palette":"solar"}'::jsonb, 1),
    ('aura:cian',      'aura',  'Aura Cian',           'Un halo de cian frío y claro.',                                    400,  0, 0, '{"palette":"cian"}'::jsonb, 2),
    ('aura:violeta',   'aura',  'Aura Violeta',        'El violeta de la Sexta Densidad. Se gana con maestría.',           600,  5, 0, '{"palette":"violeta"}'::jsonb, 3),
    ('aura:aurora',    'aura',  'Aura Aurora',         'Una aurora que cambia de tono. Pide constancia.',                  900,  0, 7, '{"palette":"aurora"}'::jsonb, 4),
    -- Anillos de órbita
    ('ring:orbita',    'ring',  'Anillo de Órbita',    'Un anillo fino que gira a tu alrededor.',                          500,  0, 0, '{"count":1}'::jsonb, 1),
    ('ring:doble',     'ring',  'Anillos Dobles',      'Dos anillos cruzados en perspectiva.',                             800,  3, 0, '{"count":2}'::jsonb, 2),
    ('ring:saturno',   'ring',  'Anillos de Saturno',  'Tres anillos inclinados. Para etapas altas.',                     1200,  5, 0, '{"count":3}'::jsonb, 3),
    -- Enjambre de Fotones (su densidad crece con tu Maestría)
    ('swarm:fotones',  'swarm', 'Enjambre de Fotones', 'Tus Fotones acumulados orbitando como motas de luz.',              500,  0, 0, '{"density":"normal"}'::jsonb, 1),
    ('swarm:denso',    'swarm', 'Enjambre Denso',      'Una nube espesa de luz girando contigo.',                         1000,  4, 0, '{"density":"alto"}'::jsonb, 2),
    -- Sellos de geometría sagrada
    ('sigil:flor',     'sigil', 'Flor de la Vida',     'Un sello de luz girando lento detrás de ti.',                      600,  0, 0, '{"glyph":"flor"}'::jsonb, 1),
    ('sigil:hexagrama','sigil', 'Hexagrama Solar',     'Una estrella de seis puntas resonando.',                           700,  0, 0, '{"glyph":"hexagrama"}'::jsonb, 2),
    ('sigil:metatron', 'sigil', 'Cubo de Metatrón',    'La geometría madre. Para iniciados.',                             1000,  4, 0, '{"glyph":"metatron"}'::jsonb, 3),
    -- Alas de luz
    ('wings:luz',      'wings', 'Alas de Luz',         'Dos arcos que se abren y destellan con tu racha.',                1500,  0, 7, '{"style":"luz"}'::jsonb, 1),
    ('wings:fenix',    'wings', 'Alas de Fénix',       'Plumas de fuego para los Diamantes de Luz.',                      2500,  6, 0, '{"style":"fenix"}'::jsonb, 2)
ON CONFLICT (item_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS
-- ════════════════════════════════════════════════════════════════════
-- Helpers + RPCs del Tripulante: solo service_role (las llama user-action).
REVOKE EXECUTE ON FUNCTION public.crystal_stage_index(text, integer)                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crystal_user_streak(text)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_crystal_chamber(text)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.select_avatar(text, text)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purchase_crystal_item(text, text)                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.equip_crystal_element(text, text, text)             FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.crystal_stage_index(text, integer)                  TO service_role;
GRANT  EXECUTE ON FUNCTION public.crystal_user_streak(text)                           TO service_role;
GRANT  EXECUTE ON FUNCTION public.get_crystal_chamber(text)                           TO service_role;
GRANT  EXECUTE ON FUNCTION public.select_avatar(text, text)                           TO service_role;
GRANT  EXECUTE ON FUNCTION public.purchase_crystal_item(text, text)                   TO service_role;
GRANT  EXECUTE ON FUNCTION public.equip_crystal_element(text, text, text)             TO service_role;

-- RPCs admin: solo service_role (las llama admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_crystal_catalog(text)                                                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_crystal_item(text, text, text, text, text, integer, integer, integer, jsonb, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_crystal_item(text, text)                                                 FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_crystal_catalog(text)                                                        TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_crystal_item(text, text, text, text, text, integer, integer, integer, jsonb, integer, boolean)  TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_delete_crystal_item(text, text)                                                  TO service_role;
