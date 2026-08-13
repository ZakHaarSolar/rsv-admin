-- Red Solar Viva · Regalo de Sintonía Solar con celebración
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Flujo VIP: el admin OFRECE el regalo desde el Motor (admin_offer_gift_sintonia),
-- que crea un regalo PENDIENTE (no activa nada todavía). El Tripulante lo ve en la
-- app como una celebración épica; al tocar "Aceptar" (claim_gift_sintonia) se
-- ACTIVA la Sintonía (misma mecánica que admin_activate_sintonia: subscription
-- de regalo + cristales del mes) y el regalo queda reclamado. Si cierra la
-- celebración sin aceptar, queda pendiente y aparece como tarjeta "Tienes un
-- regalo disponible" en Mi Núcleo hasta que lo acepte. Sin opción de rechazar.
--
-- Seguridad: las 3 RPCs van por gateway (admin-action / user-action). Un Tripulante
-- SOLO puede activar Sintonía vía claim si un admin le creó un regalo pendiente.

CREATE TABLE IF NOT EXISTS public.gift_offers (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id  text NOT NULL,
    kind           text NOT NULL DEFAULT 'sintonia_1mes',
    gifted_by      text,                       -- clerk_user_id del admin
    created_at     timestamptz NOT NULL DEFAULT now(),
    claimed_at     timestamptz,                -- NULL = pendiente
    sub_id         text                        -- id sintético de la subscription al reclamar
);
CREATE INDEX IF NOT EXISTS gift_offers_pending_idx
    ON public.gift_offers (clerk_user_id) WHERE claimed_at IS NULL;

ALTER TABLE public.gift_offers ENABLE ROW LEVEL SECURITY;
-- Sin policies → acceso solo por las RPCs SECURITY DEFINER de abajo.

-- ── Admin: ofrecer el regalo (crea pendiente, NO activa) ──────────────
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

    -- Idempotente: si ya hay un regalo pendiente, no duplicar.
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

    RETURN jsonb_build_object('success', true, 'gift_id', v_new_id);
END;
$$;

-- ── Usuario: consultar regalo pendiente ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_pending_gift(
    p_clerk_user_id text
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object('id', id, 'kind', kind, 'created_at', created_at)
    FROM gift_offers
    WHERE clerk_user_id = p_clerk_user_id AND claimed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
$$;

-- ── Usuario: aceptar el regalo → ACTIVA Sintonía + marca reclamado ────
CREATE OR REPLACE FUNCTION public.claim_gift_sintonia(
    p_clerk_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offer_id        uuid;
    v_target_email    text;
    v_target_user_id  uuid;
    v_target_name     text;
    v_now             timestamptz := now();
    v_period_end      timestamptz := now() + interval '30 days';
    v_synthetic_sub_id text;
    v_synthetic_cust_id text;
    v_new_id          uuid;
    v_mes_lunar       text := to_char(now(), 'YYYY-MM');
BEGIN
    -- Gate real: solo se activa si HAY un regalo pendiente para este usuario.
    SELECT id INTO v_offer_id
    FROM gift_offers
    WHERE clerk_user_id = p_clerk_user_id AND claimed_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;
    IF v_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'no_pending_gift');
    END IF;

    SELECT COALESCE(p.email, ''), p.id, COALESCE(p.full_name, '')
    INTO v_target_email, v_target_user_id, v_target_name
    FROM profiles p WHERE p.clerk_user_id = p_clerk_user_id LIMIT 1;

    IF v_target_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
    END IF;

    -- Activar Sintonía (misma mecánica que admin_activate_sintonia).
    v_synthetic_sub_id := 'gift_sintonia_' || p_clerk_user_id || '_'
        || (EXTRACT(EPOCH FROM v_now)::bigint)::text;
    v_synthetic_cust_id := 'gift_cust_' || p_clerk_user_id;
    v_new_id := gen_random_uuid();

    INSERT INTO subscriptions (
        id, user_id, email, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, cancel_at_period_end,
        customer_name, group_name
    ) VALUES (
        v_new_id, v_target_user_id, NULLIF(v_target_email, ''),
        v_synthetic_sub_id, v_synthetic_cust_id, 'active',
        v_now, v_period_end, true, NULLIF(v_target_name, ''), 'sintonia'
    );

    PERFORM public.emit_cristales_for_subscription(p_clerk_user_id, 'sintonia', v_mes_lunar);

    UPDATE gift_offers SET claimed_at = v_now, sub_id = v_synthetic_sub_id
    WHERE id = v_offer_id;

    RETURN jsonb_build_object('success', true, 'expires_at', v_period_end::text);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Locks: solo service_role (gateways). El usuario no puede auto-regalarse Sintonía.
REVOKE EXECUTE ON FUNCTION public.admin_offer_gift_sintonia(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_pending_gift(text)            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_gift_sintonia(text)           FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_offer_gift_sintonia(text, text) TO service_role;
GRANT  EXECUTE ON FUNCTION public.get_my_pending_gift(text)            TO service_role;
GRANT  EXECUTE ON FUNCTION public.claim_gift_sintonia(text)           TO service_role;
