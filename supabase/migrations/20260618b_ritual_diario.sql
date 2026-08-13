-- Red Solar Viva · Ritual Diario (chequeos diarios de alta frecuencia)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Actividades diarias que el Tripulante marca como hechas (Sol diario,
-- Ejercicio, Afirmaciones, Meditación, Agradecimiento). Cada una otorga
-- "Fotones" (puntos) que se acumulan — base para enlazar al avatar futuro.
-- Agradecimiento requiere texto (se escribe). El Tripulante configura qué
-- rituales ve cada día.
--
-- Seguridad: tablas con RLS sin policies → solo accesibles vía las RPCs
-- SECURITY DEFINER, ruteadas por el gateway `user-action` (que inyecta el
-- clerk_user_id verificado). Puntaje server-authoritative: los Fotones se
-- leen del catálogo en la DB, NUNCA del cliente.

-- ── Catálogo de rituales (server-authoritative de puntos) ───────────
CREATE TABLE IF NOT EXISTS public.daily_ritual_catalog (
    activity_key  text PRIMARY KEY,
    label         text NOT NULL,
    points        integer NOT NULL DEFAULT 10,
    requires_text boolean NOT NULL DEFAULT false,
    active        boolean NOT NULL DEFAULT true,
    sort_order    integer NOT NULL DEFAULT 0
);

INSERT INTO public.daily_ritual_catalog (activity_key, label, points, requires_text, sort_order) VALUES
    ('sol',           'Sol diario',     10, false, 1),
    ('ejercicio',     'Ejercicio',      10, false, 2),
    ('meditacion',    'Meditación',     10, false, 3),
    ('afirmaciones',  'Afirmaciones',   10, false, 4),
    ('agradecimiento','Agradecimiento', 15, true,  5)
ON CONFLICT (activity_key) DO UPDATE SET
    label = EXCLUDED.label,
    points = EXCLUDED.points,
    requires_text = EXCLUDED.requires_text,
    sort_order = EXCLUDED.sort_order;

-- ── Chequeos (1 fila por tripulante × ritual × día) ─────────────────
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    clerk_user_id text NOT NULL,
    activity_key  text NOT NULL,
    checkin_date  date NOT NULL,
    points        integer NOT NULL DEFAULT 0,
    note          text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, activity_key, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
    ON public.daily_checkins (clerk_user_id, checkin_date);

-- ── Config por tripulante (qué rituales ve) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_ritual_config (
    clerk_user_id text NOT NULL,
    activity_key  text NOT NULL,
    enabled       boolean NOT NULL DEFAULT true,
    sort_order    integer NOT NULL DEFAULT 0,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, activity_key)
);

ALTER TABLE public.daily_ritual_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_ritual_config   ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ── RPC: panel del día (catálogo + config + checks de hoy + puntaje) ─
CREATE OR REPLACE FUNCTION public.get_ritual_diario(
    p_clerk_user_id text,
    p_date          text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d        date := COALESCE(p_date::date, (now() AT TIME ZONE 'America/Cancun')::date);
    streak   integer := 0;
    cur      date;
    result   json;
BEGIN
    -- Racha: días consecutivos con ≥1 check, terminando hoy (o ayer si hoy
    -- aún no tiene check → un día en curso no rompe la racha).
    cur := d;
    IF NOT EXISTS (SELECT 1 FROM daily_checkins
                   WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur) THEN
        cur := cur - 1;
    END IF;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM daily_checkins
                              WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur);
        streak := streak + 1;
        cur := cur - 1;
    END LOOP;

    SELECT json_build_object(
        'date', d::text,
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'label', label,
                'points', points,
                'requires_text', requires_text,
                'sort_order', sort_order
            ) ORDER BY sort_order)
            FROM daily_ritual_catalog WHERE active
        ), '[]'::json),
        'config', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'enabled', enabled,
                'sort_order', sort_order
            ) ORDER BY sort_order)
            FROM daily_ritual_config WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'today', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'note', note,
                'points', points
            ))
            FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d
        ), '[]'::json),
        'today_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d
        ), 0),
        'total_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id
        ), 0),
        'streak', streak
    ) INTO result;

    RETURN result;
END;
$$;

-- ── RPC: marcar / desmarcar un ritual del día ───────────────────────
-- Puntos del catálogo (server-authoritative). Agradecimiento exige nota
-- para marcar. Idempotente: si ya estaba marcado, lo desmarca (toggle).
CREATE OR REPLACE FUNCTION public.toggle_ritual(
    p_clerk_user_id text,
    p_activity      text,
    p_date          text DEFAULT NULL,
    p_note          text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d        date := COALESCE(p_date::date, (now() AT TIME ZONE 'America/Cancun')::date);
    cat      daily_ritual_catalog%ROWTYPE;
    existing boolean;
    checked  boolean;
BEGIN
    SELECT * INTO cat FROM daily_ritual_catalog WHERE activity_key = p_activity AND active;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'unknown_activity');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM daily_checkins
        WHERE clerk_user_id = p_clerk_user_id AND activity_key = p_activity AND checkin_date = d
    ) INTO existing;

    IF existing THEN
        DELETE FROM daily_checkins
        WHERE clerk_user_id = p_clerk_user_id AND activity_key = p_activity AND checkin_date = d;
        checked := false;
    ELSE
        IF cat.requires_text AND (p_note IS NULL OR LENGTH(TRIM(p_note)) = 0) THEN
            RETURN json_build_object('error', 'requires_text');
        END IF;
        INSERT INTO daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
        VALUES (p_clerk_user_id, p_activity, d, cat.points,
                CASE WHEN cat.requires_text THEN LEFT(TRIM(p_note), 2000) ELSE NULL END);
        checked := true;
    END IF;

    RETURN json_build_object(
        'checked', checked,
        'activity_key', p_activity,
        'today_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d), 0),
        'total_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id), 0)
    );
END;
$$;

-- ── RPC: guardar qué rituales ve el Tripulante ──────────────────────
CREATE OR REPLACE FUNCTION public.set_ritual_config(
    p_clerk_user_id text,
    p_config        jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(p_config, '[]'::jsonb))
    LOOP
        INSERT INTO daily_ritual_config (clerk_user_id, activity_key, enabled, sort_order, updated_at)
        VALUES (
            p_clerk_user_id,
            item->>'activity_key',
            COALESCE((item->>'enabled')::boolean, true),
            COALESCE((item->>'sort_order')::int, 0),
            now()
        )
        ON CONFLICT (clerk_user_id, activity_key) DO UPDATE SET
            enabled = EXCLUDED.enabled,
            sort_order = EXCLUDED.sort_order,
            updated_at = now();
    END LOOP;
    RETURN json_build_object('ok', true);
END;
$$;

-- ── Permisos: solo service_role (las llama el gateway user-action) ──
REVOKE EXECUTE ON FUNCTION public.get_ritual_diario(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.toggle_ritual(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_ritual_config(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ritual_diario(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_ritual(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_ritual_config(text, jsonb) TO service_role;
