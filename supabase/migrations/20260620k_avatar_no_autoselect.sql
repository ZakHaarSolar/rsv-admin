-- Red Solar Viva · Cámara de Cristalización · comprar un avatar NO lo auto-usa
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cambio de UX (Zak 2026-06-20 IV): al DESBLOQUEAR un avatar extra con Fotones,
-- ya NO se selecciona/equipa solo. El Tripulante lo COMPRA y luego decide con
-- "Usar este avatar". purchase_crystal_item deja de auto-seleccionar el avatar;
-- la selección sigue por select_avatar (que para un avatar YA poseído solo lo
-- activa). El resto de la lógica (saldo = Maestría de días cerrados, requisitos
-- de etapa/racha, no-duplicar) queda idéntica a 20260620f.

CREATE OR REPLACE FUNCTION public.purchase_crystal_item(p_clerk_user_id text, p_item_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    it    crystal_catalog%ROWTYPE;
    total int; spent int; spendable int; sel text; stg int; strk int;
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
    -- Etapa 1-based (1..7); 0 = sin avatar seleccionado.
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

    -- 🜂 Ya NO se auto-selecciona el avatar al comprarlo: queda POSEÍDO y el
    -- Tripulante lo activa con "Usar este avatar" (select_avatar). Para elementos
    -- (aura/anillos/etc.) el cliente los equipa aparte tras la compra.

    RETURN json_build_object(
        'ok', true,
        'item_key', p_item_key,
        'kind', it.kind,
        'spendable', GREATEST(0, total - spent - COALESCE(it.price_fotones, 0))
    );
END;
$$;
