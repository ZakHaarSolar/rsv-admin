-- 20260616_codice_purchase_grant.sql
-- Consumible "Códice de Luz" (codice_luz, IAP de App Store): cada compra
-- concede 1 Cristal de Códice una sola vez, server-side, vía el webhook de
-- RevenueCat. Idempotente por transaction_id (un ledger evita doble
-- concesión ante reintentos del webhook). El Cristal lo canjea el tripulante
-- por cualquier Códice (la app auto-canjea el que estaba intentando abrir).

-- 1) Permitir el origen 'compra' en cristales_extraccion.
ALTER TABLE public.cristales_extraccion
    DROP CONSTRAINT IF EXISTS cristales_extraccion_origen_check;
ALTER TABLE public.cristales_extraccion
    ADD CONSTRAINT cristales_extraccion_origen_check
    CHECK (origen IN ('sintonia', 'inmersion', 'manual', 'compra'));

-- 2) Ledger idempotente de compras del consumible.
CREATE TABLE IF NOT EXISTS public.codice_purchase_ledger (
    transaction_id text PRIMARY KEY,
    clerk_user_id  text NOT NULL,
    cristal_id     uuid,
    granted_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.codice_purchase_ledger ENABLE ROW LEVEL SECURITY;
-- Sin policies: tabla cerrada; acceso solo vía la RPC (service_role).
REVOKE ALL ON public.codice_purchase_ledger FROM anon, authenticated;

-- 3) RPC: concede 1 Cristal de Códice por una compra del consumible.
--    SECURITY DEFINER; solo service_role (webhook) la ejecuta.
CREATE OR REPLACE FUNCTION public.grant_codice_cristal_from_purchase(
    p_clerk_user_id text,
    p_transaction_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows int;
    v_mes  text;
    v_id   uuid;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_transaction_id IS NULL OR p_transaction_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'transaction_id requerido');
    END IF;

    -- Idempotencia: si ya registramos esta transacción, no concedemos otra vez.
    INSERT INTO public.codice_purchase_ledger (transaction_id, clerk_user_id)
    VALUES (p_transaction_id, p_clerk_user_id)
    ON CONFLICT (transaction_id) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RETURN json_build_object('success', true, 'already_granted', true);
    END IF;

    v_mes := to_char((now() AT TIME ZONE 'America/Cancun'), 'YYYY-MM');

    INSERT INTO public.cristales_extraccion (clerk_user_id, tipo, origen, mes_lunar)
    VALUES (p_clerk_user_id, 'codice', 'compra', v_mes)
    RETURNING id INTO v_id;

    UPDATE public.codice_purchase_ledger
       SET cristal_id = v_id
     WHERE transaction_id = p_transaction_id;

    RETURN json_build_object('success', true, 'granted', 1, 'cristal_id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_codice_cristal_from_purchase(text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_codice_cristal_from_purchase(text, text)
    TO service_role;
