-- Red Solar Viva · CONSTELACIONES DE MAESTRÍA (medallas permanentes)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- QUÉ ES: 5 "Constelaciones" (categorías de medalla), cada una con varios tiers
-- (medallas) que se DESBLOQUEAN al cruzar un umbral. Los desbloqueos son
-- PERMANENTES (medal_unlocks) — una vez ganada, la medalla queda para siempre
-- aunque la métrica baje (la racha viva solo afecta el BRILLO, no la medalla).
--
-- MÉTRICAS (calculadas server-authoritative desde daily_checkins + avatar):
--   fotones      = Maestría (Fotones de días YA cerrados; hoy no cuenta aún)
--   racha        = días consecutivos hasta hoy/ayer
--   dias_activos = días distintos con al menos un ritual
--   rituales     = total de rituales cumplidos (filas reales)
--   etapa        = etapa del avatar seleccionado (1..7), mastery vs sus umbrales
--
-- EDITABLE SIN BUILD: los umbrales (cuánto se necesita por medalla) y las
-- etiquetas viven en medal_tiers → el Motor (panel "Medallas") los ajusta vía
-- admin-action. El cliente lee todo con get_my_medals.

-- ════════════════════════════════════════════════════════════════════
-- Tablas
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.medal_constelaciones (
    constelacion_key text PRIMARY KEY,
    label      text NOT NULL,
    subtitle   text NOT NULL DEFAULT '',
    glyph_key  text NOT NULL,        -- mapea a MedalGlyphs en el cliente
    metric     text NOT NULL,        -- fotones | racha | dias_activos | rituales | etapa
    accent     text NOT NULL DEFAULT '#00C2FF',
    sort_order int  NOT NULL DEFAULT 0,
    active     boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medal_tiers (
    id               bigserial PRIMARY KEY,
    constelacion_key text NOT NULL REFERENCES public.medal_constelaciones (constelacion_key) ON DELETE CASCADE,
    tier_index       int  NOT NULL,    -- 1..N dentro de la constelación
    label            text NOT NULL,
    threshold        numeric NOT NULL,
    sort_order       int  NOT NULL DEFAULT 0,
    UNIQUE (constelacion_key, tier_index)
);

CREATE TABLE IF NOT EXISTS public.medal_unlocks (
    clerk_user_id    text NOT NULL,
    constelacion_key text NOT NULL,
    tier_index       int  NOT NULL,
    unlocked_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, constelacion_key, tier_index)
);
CREATE INDEX IF NOT EXISTS idx_medal_unlocks_user ON public.medal_unlocks (clerk_user_id);

ALTER TABLE public.medal_constelaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medal_tiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medal_unlocks        ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- Seed idempotente: 5 constelaciones × tiers (NO pisa lo editado).
-- ════════════════════════════════════════════════════════════════════
INSERT INTO public.medal_constelaciones (constelacion_key, label, subtitle, glyph_key, metric, accent, sort_order) VALUES
    ('llama',     'Llama Eterna',      'Constancia diaria',     'llama',     'racha',        '#FF8A5B', 1),
    ('fotones',   'Lluvia de Fotones', 'Maestría acumulada',    'fotones',   'fotones',      '#00E5FF', 2),
    ('orbita',    'Órbita Constante',  'Días en la Red',        'orbita',    'dias_activos', '#9D7BFF', 3),
    ('pulso',     'Pulso del Ritual',  'Rituales cumplidos',    'pulso',     'rituales',     '#D4A843', 4),
    ('ascension', 'Ascensión',         'Evolución del Avatar',  'ascension', 'etapa',        '#FFFFFF', 5)
ON CONFLICT (constelacion_key) DO NOTHING;

INSERT INTO public.medal_tiers (constelacion_key, tier_index, label, threshold, sort_order) VALUES
    -- Llama Eterna (racha de días)
    ('llama', 1, 'Brasa',        3,   1),
    ('llama', 2, 'Hoguera',      7,   2),
    ('llama', 3, 'Fuego Vivo',   21,  3),
    ('llama', 4, 'Incendio',     50,  4),
    ('llama', 5, 'Llama Eterna', 100, 5),
    -- Lluvia de Fotones (Maestría)
    ('fotones', 1, 'Destello',          250,   1),
    ('fotones', 2, 'Resplandor',        1000,  2),
    ('fotones', 3, 'Fulgor',            3000,  3),
    ('fotones', 4, 'Aurora',            8000,  4),
    ('fotones', 5, 'Lluvia de Fotones', 20000, 5),
    -- Órbita Constante (días activos)
    ('orbita', 1, 'Primer Giro',     7,   1),
    ('orbita', 2, 'Órbita Baja',     30,  2),
    ('orbita', 3, 'Órbita Media',    75,  3),
    ('orbita', 4, 'Órbita Alta',     180, 4),
    ('orbita', 5, 'Año Solar',       365, 5),
    -- Pulso del Ritual (rituales cumplidos)
    ('pulso', 1, 'Primer Pulso',  25,   1),
    ('pulso', 2, 'Latido',        100,  2),
    ('pulso', 3, 'Ritmo',         365,  3),
    ('pulso', 4, 'Cadencia',      1000, 4),
    ('pulso', 5, 'Sinfonía',      3000, 5),
    -- Ascensión (etapa del avatar 1..7)
    ('ascension', 1, 'Despertar',     2, 1),
    ('ascension', 2, 'Ignición',      3, 2),
    ('ascension', 3, 'Coronación',    4, 3),
    ('ascension', 4, 'Sistema',       5, 4),
    ('ascension', 5, 'Singularidad',  7, 5)
ON CONFLICT (constelacion_key, tier_index) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- get_my_medals — calcula métricas, REGISTRA medallas nuevas (permanentes),
-- devuelve el estado completo + cuáles se acaban de desbloquear (celebración).
-- (No es STABLE: inserta en medal_unlocks.)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_medals(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_total    int := 0;   -- Maestría (días cerrados)
    v_streak   int := 0;
    v_dias     int := 0;
    v_rituales int := 0;
    v_etapa    int := 1;
    v_av       text;
    v_th       jsonb;
    v_new      json;
    result     json;
BEGIN
    SELECT COALESCE(SUM(points), 0)::int INTO v_total
    FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id AND checkin_date < d_today;

    SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date <> DATE '2000-01-01';

    SELECT COUNT(*)::int INTO v_rituales
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND activity_key <> 'admin_adjust';

    -- Racha actual (corrida consecutiva que termina en hoy o ayer).
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

    -- Etapa del avatar seleccionado (mastery vs sus umbrales).
    SELECT selected_avatar INTO v_av FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    v_av := COALESCE(v_av, 'nova');
    SELECT thresholds INTO v_th FROM avatar_config WHERE avatar_key = v_av;
    v_th := COALESCE(v_th, '[0,50,250,800,2000,5000,12000]'::jsonb);
    SELECT GREATEST(COUNT(*), 1)::int INTO v_etapa
    FROM jsonb_array_elements_text(v_th) t WHERE v_total >= (t::numeric);

    -- Registrar medallas recién cruzadas (permanentes). RETURNING = las nuevas.
    WITH mv(metric, val) AS (
        VALUES ('fotones', v_total), ('racha', v_streak), ('dias_activos', v_dias),
               ('rituales', v_rituales), ('etapa', v_etapa)
    ),
    ins AS (
        INSERT INTO medal_unlocks (clerk_user_id, constelacion_key, tier_index)
        SELECT p_clerk_user_id, mc.constelacion_key, mt.tier_index
        FROM medal_tiers mt
        JOIN medal_constelaciones mc ON mc.constelacion_key = mt.constelacion_key AND mc.active
        JOIN mv ON mv.metric = mc.metric
        WHERE mv.val >= mt.threshold
        ON CONFLICT DO NOTHING
        RETURNING constelacion_key, tier_index
    )
    SELECT COALESCE(json_agg(json_build_object(
        'constelacion_key', constelacion_key, 'tier_index', tier_index
    )), '[]'::json) INTO v_new FROM ins;

    SELECT json_build_object(
        'metrics', json_build_object(
            'fotones', v_total, 'racha', v_streak, 'dias_activos', v_dias,
            'rituales', v_rituales, 'etapa', v_etapa
        ),
        'new_unlocks', v_new,
        'constelaciones', COALESCE((
            SELECT json_agg(json_build_object(
                'key', mc.constelacion_key,
                'label', mc.label,
                'subtitle', mc.subtitle,
                'glyph', mc.glyph_key,
                'metric', mc.metric,
                'accent', mc.accent,
                'value', (CASE mc.metric
                    WHEN 'fotones'      THEN v_total
                    WHEN 'racha'        THEN v_streak
                    WHEN 'dias_activos' THEN v_dias
                    WHEN 'rituales'     THEN v_rituales
                    WHEN 'etapa'        THEN v_etapa
                    ELSE 0 END),
                'tiers', COALESCE((
                    SELECT json_agg(json_build_object(
                        'tier_index', mt.tier_index,
                        'label', mt.label,
                        'threshold', mt.threshold,
                        'unlocked', (mu.clerk_user_id IS NOT NULL),
                        'unlocked_at', mu.unlocked_at
                    ) ORDER BY mt.tier_index)
                    FROM medal_tiers mt
                    LEFT JOIN medal_unlocks mu
                        ON mu.clerk_user_id = p_clerk_user_id
                       AND mu.constelacion_key = mt.constelacion_key
                       AND mu.tier_index = mt.tier_index
                    WHERE mt.constelacion_key = mc.constelacion_key
                ), '[]'::json)
            ) ORDER BY mc.sort_order, mc.label)
            FROM medal_constelaciones mc WHERE mc.active
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs admin (gateway admin-action; inyecta p_admin_clerk_id + re-check)
-- ════════════════════════════════════════════════════════════════════

-- Catálogo completo (constelaciones + tiers) para el editor del Motor.
CREATE OR REPLACE FUNCTION public.admin_get_medallas(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    SELECT COALESCE(json_agg(json_build_object(
        'key', mc.constelacion_key,
        'label', mc.label,
        'subtitle', mc.subtitle,
        'glyph', mc.glyph_key,
        'metric', mc.metric,
        'accent', mc.accent,
        'active', mc.active,
        'sort_order', mc.sort_order,
        'tiers', COALESCE((
            SELECT json_agg(json_build_object(
                'tier_index', mt.tier_index, 'label', mt.label, 'threshold', mt.threshold
            ) ORDER BY mt.tier_index)
            FROM medal_tiers mt WHERE mt.constelacion_key = mc.constelacion_key
        ), '[]'::json)
    ) ORDER BY mc.sort_order, mc.label), '[]'::json)
    INTO result FROM medal_constelaciones mc;
    RETURN result;
END;
$$;

-- Editar un tier (umbral + etiqueta). Crea el tier si no existe.
CREATE OR REPLACE FUNCTION public.admin_upsert_medal_tier(
    p_admin_clerk_id text,
    p_constelacion_key text,
    p_tier_index int,
    p_label text,
    p_threshold numeric
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
    IF NOT EXISTS (SELECT 1 FROM medal_constelaciones WHERE constelacion_key = p_constelacion_key) THEN
        RETURN json_build_object('error', 'no_constelacion');
    END IF;
    INSERT INTO medal_tiers (constelacion_key, tier_index, label, threshold, sort_order)
    VALUES (p_constelacion_key, p_tier_index, LEFT(TRIM(COALESCE(p_label, '')), 40), GREATEST(COALESCE(p_threshold, 0), 0), p_tier_index)
    ON CONFLICT (constelacion_key, tier_index) DO UPDATE
        SET label = EXCLUDED.label, threshold = EXCLUDED.threshold;
    RETURN json_build_object('ok', true);
END;
$$;

-- Editar la meta de una constelación (etiqueta, subtítulo, activa).
CREATE OR REPLACE FUNCTION public.admin_set_medal_constelacion(
    p_admin_clerk_id text,
    p_constelacion_key text,
    p_label text,
    p_subtitle text,
    p_active boolean
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
    UPDATE medal_constelaciones
    SET label = LEFT(TRIM(COALESCE(p_label, label)), 40),
        subtitle = LEFT(TRIM(COALESCE(p_subtitle, subtitle)), 60),
        active = COALESCE(p_active, active),
        updated_at = now()
    WHERE constelacion_key = p_constelacion_key;
    RETURN json_build_object('ok', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS (el candado): REVOKE anon, GRANT service_role.
-- ════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.get_my_medals(text)                                   FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_medals(text)                                   TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_get_medallas(text)                              FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_medallas(text)                              TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_medal_tier(text, text, int, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_medal_tier(text, text, int, text, numeric) TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_set_medal_constelacion(text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_medal_constelacion(text, text, text, text, boolean) TO service_role;

NOTIFY pgrst, 'reload schema';
