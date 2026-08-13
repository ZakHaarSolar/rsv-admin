-- Red Solar Viva · Cámara de Cristalización · "Total cerrado" (Maestría)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cambio de mecánica (Zak 2026-06-20): los Fotones de HOY NO cuentan todavía
-- para la evolución del avatar ni para gastar. El "total" (Maestría) acumula
-- SOLO al cerrar el día — el Tripulante hace sus rituales hoy y se EMOCIONA por
-- la evolución de mañana, no sube de nivel con un clic en el momento. Mismo
-- criterio que el "Total histórico" del Ritual Diario (total − hoy).
--
-- Implementación: el total usado por la Cámara = SUM(points) de los días YA
-- CERRADOS (checkin_date < hoy, zona America/Cancun). La fila sentinela del
-- ajuste admin (fecha 2000-01-01) es < hoy → SÍ cuenta (los ajustes de prueba
-- siguen evolucionando el avatar al instante). CREATE OR REPLACE preserva los
-- GRANT existentes; no se tocan permisos.

-- ── get_crystal_chamber: total = Maestría (días cerrados) ────────────
CREATE OR REPLACE FUNCTION public.get_crystal_chamber(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total int; spent int; sel text; eq jsonb; stg int; strk int; result json;
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
BEGIN
    -- Maestría = Fotones de los días YA CERRADOS (hoy aún no cuenta).
    SELECT COALESCE(SUM(points), 0)::int INTO total
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date < d_today;

    SELECT COALESCE(SUM(cost_paid), 0)::int INTO spent
    FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id;
    SELECT selected_avatar, equipped INTO sel, eq
    FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    -- Etapa 1-based (1..7) para que coincida con lo que ve el Tripulante.
    -- crystal_stage_index es 0-based (0..6) → +1. 0 = sin avatar seleccionado.
    stg := CASE WHEN sel IS NULL THEN 0 ELSE crystal_stage_index(sel, total) + 1 END;
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

-- ── purchase_crystal_item: valida saldo/etapa con la Maestría (días cerrados) ──
CREATE OR REPLACE FUNCTION public.purchase_crystal_item(p_clerk_user_id text, p_item_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    it    crystal_catalog%ROWTYPE;
    total int; spent int; spendable int; sel text; stg int; strk int; av text;
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
BEGIN
    SELECT * INTO it FROM crystal_catalog WHERE item_key = p_item_key AND active;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'unknown_item');
    END IF;
    IF EXISTS (SELECT 1 FROM user_crystal_owned WHERE clerk_user_id = p_clerk_user_id AND item_key = p_item_key) THEN
        RETURN json_build_object('error', 'already_owned');
    END IF;

    -- Maestría = días cerrados (hoy no cuenta para gastar ni para requisitos).
    SELECT COALESCE(SUM(points), 0)::int INTO total
    FROM daily_checkins
    WHERE clerk_user_id = p_clerk_user_id AND checkin_date < d_today;

    SELECT selected_avatar INTO sel FROM user_crystal_state WHERE clerk_user_id = p_clerk_user_id;
    -- Etapa 1-based (1..7) para que coincida con lo que ve el Tripulante.
    -- crystal_stage_index es 0-based (0..6) → +1. 0 = sin avatar seleccionado.
    stg := CASE WHEN sel IS NULL THEN 0 ELSE crystal_stage_index(sel, total) + 1 END;
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
