-- Red Solar Viva · Avatar de Luz · Config DB-driven + ajuste de Fotones (admin)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El "Avatar de Luz" (Nova Semilla / Aurelia / Prisma) evoluciona por etapas
-- según los Fotones acumulados del Ritual Diario. Hasta hoy los UMBRALES de
-- cada etapa vivían hardcodeados en cada componente del cliente → cambiarlos
-- exigía un build nuevo. Esta tabla los mueve al backend: el cliente lee
-- `get_avatar_config()` (RPC pública anon) y dibuja las etapas con esos
-- umbrales → Zak los ajusta desde el Motor SIN build.
--
-- Además: un ajustador de Fotones admin (server-authoritative vía
-- daily_checkins) para la cuenta de pruebas (cuerpodeluz555@gmail.com) — sumar
-- o restar Fotones a voluntad para ver el avatar evolucionar. El ajuste vive
-- en una fila SENTINELA de daily_checkins (activity_key='admin_adjust',
-- checkin_date='2000-01-01') → cuenta en total_fotones (SUM de todos los
-- puntos) pero NO contamina today_fotones (otra fecha) ni la racha (no es
-- contigua a hoy). Limpio y reversible (delta negativo).
--
-- Seguridad: la tabla con RLS sin policies → solo accesible vía las RPCs
-- SECURITY DEFINER. La pública (get_avatar_config) va GRANT a anon (es config
-- de tuning global, CERO PII — patrón de catálogo, como get_wallpapers). Las
-- admin_* van REVOKE anon + GRANT service_role (las llama el gateway
-- admin-action tras verificar el token; doble blindaje is_admin en cada RPC).

-- ── Tabla de configuración por avatar ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.avatar_config (
    avatar_key text PRIMARY KEY,             -- 'nova' | 'aurelia' | 'prisma'
    label      text NOT NULL,
    thresholds jsonb NOT NULL,               -- [7] enteros: Fotones acumulados por etapa (asc, el 1º es 0)
    params     jsonb NOT NULL DEFAULT '{"glow":100,"breath":100,"spin":100}'::jsonb,  -- multiplicadores en % (100 = 1.0×)
    sort_order integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Semilla: los mismos umbrales con los que arrancaron los componentes (Nova/
-- Aurelia) + Prisma. Idempotente: si ya existe, NO pisa lo que Zak haya
-- ajustado (DO NOTHING).
INSERT INTO public.avatar_config (avatar_key, label, thresholds, params, sort_order) VALUES
    ('nova',    'Nova Semilla', '[0,50,250,800,2000,5000,12000]'::jsonb, '{"glow":100,"breath":100,"spin":100}'::jsonb, 1),
    ('aurelia', 'Aurelia',      '[0,50,250,700,1600,3200,6000]'::jsonb,  '{"glow":100,"breath":100,"spin":100}'::jsonb, 2),
    ('prisma',  'Prisma',       '[0,50,250,800,2000,5000,12000]'::jsonb, '{"glow":100,"breath":100,"spin":100}'::jsonb, 3)
ON CONFLICT (avatar_key) DO NOTHING;

ALTER TABLE public.avatar_config ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- RPC PÚBLICA  (el cliente del avatar la llama directo con la anon key —
-- config de tuning global sin PII, patrón de catálogo como get_wallpapers)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_avatar_config()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'avatar_key', avatar_key,
        'thresholds', thresholds,
        'params', params
    ) ORDER BY sort_order, avatar_key), '[]'::json)
    INTO result
    FROM avatar_config;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN — Config (ruteadas por admin-action; doble blindaje:
-- gateway valida is_admin + estas revalidan con el id admin inyectado)
-- ════════════════════════════════════════════════════════════════════

-- Config completa (incluye label/sort) para el editor del Motor.
CREATE OR REPLACE FUNCTION public.admin_get_avatar_config(p_admin_clerk_id text)
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
        'avatar_key', avatar_key,
        'label', label,
        'thresholds', thresholds,
        'params', params,
        'sort_order', sort_order,
        'updated_at', updated_at
    ) ORDER BY sort_order, avatar_key), '[]'::json)
    INTO result
    FROM avatar_config;

    RETURN result;
END;
$$;

-- Actualiza thresholds + params de un avatar (upsert por avatar_key = PK).
-- Sanitiza thresholds: 7 enteros ≥0, ascendentes, el 1º forzado a 0.
CREATE OR REPLACE FUNCTION public.admin_upsert_avatar_config(
    p_admin_clerk_id text,
    p_avatar_key     text,
    p_label          text,
    p_thresholds     jsonb,
    p_params         jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    k       text := LEFT(TRIM(COALESCE(p_avatar_key, '')), 40);
    nm      text := LEFT(TRIM(COALESCE(p_label, '')), 120);
    elem    jsonb;
    i       int := 0;
    prev    int := -1;
    cur     int;
    cleaned jsonb := '[]'::jsonb;
    r       avatar_config%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF LENGTH(k) = 0 THEN
        RETURN json_build_object('error', 'empty_key');
    END IF;

    -- Saneo de umbrales: enteros ≥0, ascendentes estrictos, el 1º = 0.
    IF jsonb_typeof(p_thresholds) = 'array' THEN
        FOR elem IN SELECT * FROM jsonb_array_elements(p_thresholds)
        LOOP
            -- `#>> '{}'` extrae el escalar como texto sin comillas (sirve para
            -- número JSON 50 → '50' y para string "50" → '50').
            cur := GREATEST(0, FLOOR(COALESCE((elem #>> '{}')::numeric, 0))::int);
            IF i = 0 THEN
                cur := 0;
            ELSIF cur <= prev THEN
                cur := prev + 1;
            END IF;
            cleaned := cleaned || to_jsonb(cur);
            prev := cur;
            i := i + 1;
        END LOOP;
    END IF;
    -- Debe quedar con al menos 7 elementos para las 7 etapas.
    IF jsonb_array_length(cleaned) < 7 THEN
        RETURN json_build_object('error', 'thresholds_need_7');
    END IF;

    INSERT INTO avatar_config (avatar_key, label, thresholds, params, sort_order, updated_at)
    VALUES (
        k,
        CASE WHEN LENGTH(nm) > 0 THEN nm ELSE k END,
        cleaned,
        COALESCE(p_params, '{"glow":100,"breath":100,"spin":100}'::jsonb),
        COALESCE((SELECT sort_order FROM avatar_config WHERE avatar_key = k), 99),
        now()
    )
    ON CONFLICT (avatar_key) DO UPDATE
    SET label      = CASE WHEN LENGTH(nm) > 0 THEN nm ELSE avatar_config.label END,
        thresholds = cleaned,
        params     = COALESCE(p_params, avatar_config.params),
        updated_at = now()
    RETURNING * INTO r;

    RETURN json_build_object(
        'avatar_key', r.avatar_key,
        'label', r.label,
        'thresholds', r.thresholds,
        'params', r.params,
        'sort_order', r.sort_order
    );
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN — Ajuste de Fotones (server-authoritative vía daily_checkins).
-- Para la cuenta de pruebas: ver el avatar evolucionar a voluntad. El ajuste
-- vive en una fila sentinela (activity_key='admin_adjust', fecha 2000-01-01)
-- → cuenta en total_fotones pero NO en today/racha.
-- ════════════════════════════════════════════════════════════════════

-- Lee el total actual de Fotones de un tripulante por email (para el panel).
CREATE OR REPLACE FUNCTION public.admin_get_user_fotones(
    p_admin_clerk_id text,
    p_target_email   text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    em  text := lower(trim(coalesce(p_target_email, '')));
    uid text;
    nm  text;
    tot int;
    adj int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF length(em) = 0 THEN
        RETURN json_build_object('found', false, 'error', 'empty_email');
    END IF;

    SELECT clerk_user_id, full_name INTO uid, nm
    FROM profiles
    WHERE lower(email) = em
    ORDER BY (is_admin IS TRUE) DESC
    LIMIT 1;

    IF uid IS NULL THEN
        RETURN json_build_object('found', false, 'email', em);
    END IF;

    SELECT COALESCE(SUM(points), 0)::int INTO tot
    FROM daily_checkins WHERE clerk_user_id = uid;
    SELECT COALESCE(SUM(points), 0)::int INTO adj
    FROM daily_checkins WHERE clerk_user_id = uid AND activity_key = 'admin_adjust';

    RETURN json_build_object(
        'found', true,
        'email', em,
        'full_name', nm,
        'clerk_user_id', uid,
        'total_fotones', tot,
        'manual_adjust', adj
    );
END;
$$;

-- Suma/resta p_delta Fotones (delta negativo resta). Clampa el TOTAL a ≥0.
CREATE OR REPLACE FUNCTION public.admin_adjust_user_fotones(
    p_admin_clerk_id text,
    p_target_email   text,
    p_delta          integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    em      text := lower(trim(coalesce(p_target_email, '')));
    d       date := DATE '2000-01-01';
    uid     text;
    other   int;
    cur_adj int;
    new_adj int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT clerk_user_id INTO uid FROM profiles
    WHERE lower(email) = em ORDER BY (is_admin IS TRUE) DESC LIMIT 1;
    IF uid IS NULL THEN
        RETURN json_build_object('error', 'user_not_found', 'email', em);
    END IF;

    SELECT COALESCE(SUM(points), 0)::int INTO other
    FROM daily_checkins
    WHERE clerk_user_id = uid
      AND NOT (activity_key = 'admin_adjust' AND checkin_date = d);
    SELECT COALESCE(points, 0) INTO cur_adj
    FROM daily_checkins
    WHERE clerk_user_id = uid AND activity_key = 'admin_adjust' AND checkin_date = d;

    new_adj := COALESCE(cur_adj, 0) + COALESCE(p_delta, 0);
    IF other + new_adj < 0 THEN
        new_adj := -other;   -- clamp: total nunca negativo
    END IF;

    INSERT INTO daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
    VALUES (uid, 'admin_adjust', d, new_adj, 'ajuste admin (pruebas)')
    ON CONFLICT (clerk_user_id, activity_key, checkin_date)
    DO UPDATE SET points = EXCLUDED.points, note = EXCLUDED.note;

    RETURN json_build_object(
        'ok', true,
        'email', em,
        'clerk_user_id', uid,
        'total_fotones', other + new_adj,
        'manual_adjust', new_adj
    );
END;
$$;

-- Fija el TOTAL exacto de Fotones (útil para saltar a una etapa de prueba).
-- Ajusta la fila sentinela para que total == p_total (≥0).
CREATE OR REPLACE FUNCTION public.admin_set_user_fotones(
    p_admin_clerk_id text,
    p_target_email   text,
    p_total          integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    em      text := lower(trim(coalesce(p_target_email, '')));
    d       date := DATE '2000-01-01';
    uid     text;
    other   int;
    target  int := GREATEST(0, COALESCE(p_total, 0));
    new_adj int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT clerk_user_id INTO uid FROM profiles
    WHERE lower(email) = em ORDER BY (is_admin IS TRUE) DESC LIMIT 1;
    IF uid IS NULL THEN
        RETURN json_build_object('error', 'user_not_found', 'email', em);
    END IF;

    SELECT COALESCE(SUM(points), 0)::int INTO other
    FROM daily_checkins
    WHERE clerk_user_id = uid
      AND NOT (activity_key = 'admin_adjust' AND checkin_date = d);

    new_adj := target - other;   -- total = other + new_adj = target exacto

    INSERT INTO daily_checkins (clerk_user_id, activity_key, checkin_date, points, note)
    VALUES (uid, 'admin_adjust', d, new_adj, 'ajuste admin (pruebas)')
    ON CONFLICT (clerk_user_id, activity_key, checkin_date)
    DO UPDATE SET points = EXCLUDED.points, note = EXCLUDED.note;

    RETURN json_build_object(
        'ok', true,
        'email', em,
        'clerk_user_id', uid,
        'total_fotones', target,
        'manual_adjust', new_adj
    );
END;
$$;

-- ── Permisos ────────────────────────────────────────────────────────
-- Pública: anon + authenticated (la llama el cliente del avatar con la anon key).
GRANT EXECUTE ON FUNCTION public.get_avatar_config()                                          TO anon, authenticated;

-- Admin: solo service_role (las llama el gateway admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_avatar_config(text)                               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_avatar_config(text, text, text, jsonb, jsonb)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_fotones(text, text)                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_user_fotones(text, text, integer)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_fotones(text, text, integer)                 FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_avatar_config(text)                                TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_avatar_config(text, text, text, jsonb, jsonb)   TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_user_fotones(text, text)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_fotones(text, text, integer)               TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_fotones(text, text, integer)                  TO service_role;
