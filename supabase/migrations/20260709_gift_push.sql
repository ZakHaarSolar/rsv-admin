-- 20260709_gift_push.sql — Notificación PUSH al REGALAR Sintonía Solar.
-- Al Tripulante le llega un push (como cuando recibe un mensaje) en el instante
-- en que el admin le regala 1 mes de Sintonía desde el Motor. Reusa EXACTAMENTE
-- la infra de push de los DMs: _push_dispatch → send-push (APNs) con el mismo
-- push_tokens + secreto del Vault. CREATE OR REPLACE FIEL del cuerpo de
-- 20260629b_gift_sintonia.sql + un PERFORM del push tras crear el regalo nuevo.
-- Idempotente: NO re-pushea un regalo que ya estaba pendiente. Si la infra de
-- push falla, el regalo se crea igual (el push nunca rompe el flujo).
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.admin_offer_gift_sintonia(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing uuid;
    v_new_id   uuid;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE clerk_user_id = p_target_clerk_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tripulante no encontrado');
    END IF;

    -- Idempotente: si ya hay un regalo pendiente, no duplicar (ni re-pushear).
    SELECT id INTO v_existing
    FROM gift_offers
    WHERE clerk_user_id = p_target_clerk_id AND claimed_at IS NULL
    LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'gift_id', v_existing, 'already_pending', true);
    END IF;

    v_new_id := gen_random_uuid();
    INSERT INTO gift_offers (id, clerk_user_id, kind, gifted_by)
    VALUES (v_new_id, p_target_clerk_id, 'sintonia_1mes', p_admin_clerk_id);

    -- PUSH al Tripulante (misma vía que los DMs). Nunca rompe el regalo: el
    -- helper ya swallowa sus propios errores; el bloque extra cubre el caso
    -- de que _push_dispatch no exista en algún entorno.
    BEGIN
        PERFORM public._push_dispatch(
            p_target_clerk_id,
            'Un regalo para ti ✦',
            'Zak y Aqua te regalaron 1 mes de Sintonía Solar',
            jsonb_build_object('type', 'gift')
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object('success', true, 'gift_id', v_new_id);
END;
$$;
