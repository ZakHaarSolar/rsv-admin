-- Red Solar Viva · Avatar de Luz · FOOTPRINT DB-driven (tamaño de los elementos
-- de la Cámara por AVATAR × ETAPA, editable desde el Motor sin build)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Hasta hoy el "radio visual" del avatar por (tipo, etapa) — la tabla que rige
-- el tamaño/posición de TODOS los elementos (anillos, aura, enjambre, sello,
-- alas) — vivía HARDCODED en el cliente (nucleo/avatarFootprint.ts) → afinar
-- "el anillo le queda chico a Prisma en su etapa 7" exigía un build.
--
-- Esta migración mueve ese ajuste al backend, en una columna `footprint jsonb`
-- de avatar_config. Forma por avatar:
--   {
--     "base":  [b1..b7],   -- radio del avatar por etapa, % del semi-lado (5..120)
--     "ring":  [s1..s7],   -- multiplicador de tamaño por etapa, % (100 = 1.0×)
--     "aura":  [s1..s7],
--     "swarm": [s1..s7],
--     "sigil": [s1..s7],
--     "wings": [s1..s7]
--   }
-- `base` = el tamaño del avatar (todos los elementos lo abrazan); los demás =
-- multiplicador fino por elemento. El cliente lee esto vía get_avatar_config
-- (RPC pública anon) y, si falta, usa sus DEFAULT en código (cero cambio
-- visual). "Si no se modifica, se queda como está."
--
-- Seguridad: la lectura pública (get_avatar_config) sigue anon (config global,
-- sin PII). La edición (admin_upsert_avatar_config) sigue admin-only por el
-- gateway admin-action (ya whitelisted) + REVOKE anon. El gateway reenvía
-- p_footprint sin cambios → NO requiere redeploy del edge.

-- ── Columna nueva ───────────────────────────────────────────────────
ALTER TABLE public.avatar_config ADD COLUMN IF NOT EXISTS footprint jsonb;

-- Semilla de footprint = los MISMOS valores con los que arrancó el cliente
-- (base = la tabla FOOTPRINT × 100; elementos = 100 = sin cambio). Idempotente:
-- solo escribe donde aún es NULL → no pisa lo que se ajuste después.
UPDATE public.avatar_config SET footprint =
    '{"base":[30,33,39,46,52,55,36],"ring":[100,100,100,100,100,100,100],"aura":[100,100,100,100,100,100,100],"swarm":[100,100,100,100,100,100,100],"sigil":[100,100,100,100,100,100,100],"wings":[100,100,100,100,100,100,100]}'::jsonb
    WHERE avatar_key = 'nova' AND footprint IS NULL;
UPDATE public.avatar_config SET footprint =
    '{"base":[28,36,46,54,58,58,46],"ring":[100,100,100,100,100,100,100],"aura":[100,100,100,100,100,100,100],"swarm":[100,100,100,100,100,100,100],"sigil":[100,100,100,100,100,100,100],"wings":[100,100,100,100,100,100,100]}'::jsonb
    WHERE avatar_key = 'aurelia' AND footprint IS NULL;
UPDATE public.avatar_config SET footprint =
    '{"base":[40,42,44,46,49,52,55],"ring":[100,100,100,100,100,100,100],"aura":[100,100,100,100,100,100,100],"swarm":[100,100,100,100,100,100,100],"sigil":[100,100,100,100,100,100,100],"wings":[100,100,100,100,100,100,100]}'::jsonb
    WHERE avatar_key = 'prisma' AND footprint IS NULL;

-- ════════════════════════════════════════════════════════════════════
-- RPC PÚBLICA — ahora incluye footprint (el cliente lo lee con la anon key).
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
        'params', params,
        'footprint', footprint
    ) ORDER BY sort_order, avatar_key), '[]'::json)
    INTO result
    FROM avatar_config;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPC ADMIN — config completa para el editor (incluye footprint).
-- ════════════════════════════════════════════════════════════════════
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
        'footprint', footprint,
        'sort_order', sort_order,
        'updated_at', updated_at
    ) ORDER BY sort_order, avatar_key), '[]'::json)
    INTO result
    FROM avatar_config;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPC ADMIN — upsert con p_footprint NUEVO. Cambia la firma (suma un param)
-- → hay que DROP la versión vieja antes del CREATE para no dejar 2 overloads
-- (PostgREST quedaría ambiguo).
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.admin_upsert_avatar_config(text, text, text, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.admin_upsert_avatar_config(
    p_admin_clerk_id text,
    p_avatar_key     text,
    p_label          text,
    p_thresholds     jsonb,
    p_params         jsonb,
    p_footprint      jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    k          text := LEFT(TRIM(COALESCE(p_avatar_key, '')), 40);
    nm         text := LEFT(TRIM(COALESCE(p_label, '')), 120);
    elem       jsonb;
    i          int := 0;
    prev       int := -1;
    cur        int;
    cleaned    jsonb := '[]'::jsonb;
    -- footprint sanitizado
    fp_keys    text[] := ARRAY['base','ring','aura','swarm','sigil','wings'];
    fp_key     text;
    fp_arr     jsonb;
    fp_clean   jsonb;
    fp_val     int;
    fp_i       int;
    existing   jsonb;
    prov       jsonb := '{}'::jsonb;
    r          avatar_config%ROWTYPE;
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
    IF jsonb_array_length(cleaned) < 7 THEN
        RETURN json_build_object('error', 'thresholds_need_7');
    END IF;

    -- Saneo de footprint: por cada clave permitida que venga como array de ≥7,
    -- construir un arreglo de 7 enteros clampados [1..500]. Las claves ausentes
    -- conservan su valor previo (merge sobre el footprint existente).
    existing := COALESCE((SELECT footprint FROM avatar_config WHERE avatar_key = k), '{}'::jsonb);
    IF p_footprint IS NOT NULL AND jsonb_typeof(p_footprint) = 'object' THEN
        FOREACH fp_key IN ARRAY fp_keys LOOP
            fp_arr := p_footprint -> fp_key;
            IF fp_arr IS NOT NULL AND jsonb_typeof(fp_arr) = 'array'
               AND jsonb_array_length(fp_arr) >= 7 THEN
                fp_clean := '[]'::jsonb;
                FOR fp_i IN 0..6 LOOP
                    fp_val := GREATEST(1, LEAST(500,
                        FLOOR(COALESCE((fp_arr -> fp_i #>> '{}')::numeric, 100))::int));
                    fp_clean := fp_clean || to_jsonb(fp_val);
                END LOOP;
                prov := prov || jsonb_build_object(fp_key, fp_clean);
            END IF;
        END LOOP;
    END IF;

    INSERT INTO avatar_config (avatar_key, label, thresholds, params, footprint, sort_order, updated_at)
    VALUES (
        k,
        CASE WHEN LENGTH(nm) > 0 THEN nm ELSE k END,
        cleaned,
        COALESCE(p_params, '{"glow":100,"breath":100,"spin":100}'::jsonb),
        NULLIF(existing || prov, '{}'::jsonb),
        COALESCE((SELECT sort_order FROM avatar_config WHERE avatar_key = k), 99),
        now()
    )
    ON CONFLICT (avatar_key) DO UPDATE
    SET label      = CASE WHEN LENGTH(nm) > 0 THEN nm ELSE avatar_config.label END,
        thresholds = cleaned,
        params     = COALESCE(p_params, avatar_config.params),
        footprint  = NULLIF(COALESCE(avatar_config.footprint, '{}'::jsonb) || prov, '{}'::jsonb),
        updated_at = now()
    RETURNING * INTO r;

    RETURN json_build_object(
        'avatar_key', r.avatar_key,
        'label', r.label,
        'thresholds', r.thresholds,
        'params', r.params,
        'footprint', r.footprint,
        'sort_order', r.sort_order
    );
END;
$$;

-- ── Permisos (el DROP+CREATE de admin_upsert_avatar_config borra sus grants) ──
GRANT EXECUTE ON FUNCTION public.get_avatar_config()                                                      TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_avatar_config(text, text, text, jsonb, jsonb, jsonb)       FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_avatar_config(text, text, text, jsonb, jsonb, jsonb)       TO service_role;
