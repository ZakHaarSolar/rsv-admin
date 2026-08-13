-- 20260430_redeem_with_cristal.sql
-- Mecánica de canje de Cristales de Extracción contra catálogo.
--
-- Componentes:
--   1. ALTER TABLE purchases ADD COLUMN acquired_via TEXT
--      ('pago' default | 'cristal'). El stripe-webhook setea 'pago'
--      en sus inserts; los canjes usan 'cristal'. La telemetría de
--      ingresos excluye filas con acquired_via='cristal' porque no
--      son revenue real.
--
--   2. Tabla meditaciones_owned: catálogo de meditaciones desbloqueadas
--      por Tripulante. Las meditaciones son pago único (sin tabla de
--      compras dedicada hasta ahora), así que esta tabla unifica los
--      tres caminos: 'cristal' (canje), 'pago' (Stripe directo si lo
--      lanzamos) y 'inmersion_libre' (acceso de Inmersión Solar).
--
--   3. RPC redeem_codice_with_cristal: en una transacción, descuenta
--      un cristal dorado y registra la compra en `purchases`.
--
--   4. RPC redeem_meditacion_with_cristal: descuenta un cristal cyan
--      y registra acceso en `meditaciones_owned`.
--
--   5. RPC get_my_meditaciones_owned: lista qué meditaciones tiene
--      el Tripulante (incluye las que adquirió por cristal y las
--      automáticas de Inmersión Solar).
--
--   6. RPC get_my_membership_tier: retorna 'sintonia' | 'inmersion'
--      | 'explorer'. Lo usa el frontend para decidir si una
--      meditación se reproduce libre (Inmersión) o requiere canje
--      (Sintonía / Explorer).

-- ─────────────────────────────────────────────────────────────────
-- 1. ALTER purchases — acquired_via
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'purchases'
          AND column_name = 'acquired_via'
    ) THEN
        ALTER TABLE public.purchases
            ADD COLUMN acquired_via TEXT NOT NULL DEFAULT 'pago'
                CHECK (acquired_via IN ('pago', 'cristal'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchases_acquired_via
    ON public.purchases (acquired_via);

-- ─────────────────────────────────────────────────────────────────
-- 2. Tabla meditaciones_owned
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meditaciones_owned (
    id uuid primary key default gen_random_uuid(),
    clerk_user_id text not null,
    meditacion_id text not null,
    acquired_via text not null default 'cristal'
        check (acquired_via in ('cristal', 'pago', 'inmersion_libre')),
    acquired_at timestamptz not null default now(),
    UNIQUE (clerk_user_id, meditacion_id)
);

CREATE INDEX IF NOT EXISTS idx_meditaciones_owned_user
    ON public.meditaciones_owned (clerk_user_id);

ALTER TABLE public.meditaciones_owned ENABLE ROW LEVEL SECURITY;
-- Sin policies: acceso solo vía RPCs SECURITY DEFINER.

-- ─────────────────────────────────────────────────────────────────
-- 3. RPC: redeem_codice_with_cristal
-- En una transacción atómica:
--   a. Resuelve email y user_id desde profiles (clerk_user_id).
--   b. Si ya hay purchase del book_id por email/clerk → idempotent OK.
--   c. Llama canjear_cristal('codice', book_id). Si no hay cristales,
--      retorna error.
--   d. Inserta en purchases con acquired_via='cristal',
--      formats_purchased=p_formats.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_codice_with_cristal(
    p_clerk_user_id text,
    p_book_id text,
    p_formats text[] DEFAULT ARRAY['pdf']::text[]
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_canje_result json;
    v_existing_purchase_id uuid;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_book_id IS NULL OR p_book_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'book_id requerido');
    END IF;
    IF p_formats IS NULL OR array_length(p_formats, 1) IS NULL THEN
        p_formats := ARRAY['pdf']::text[];
    END IF;

    -- Resolver perfil
    SELECT id, email INTO v_user_id, v_email
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'profile_not_found'
        );
    END IF;

    -- Si ya hay purchase activa para este email/book, retornamos OK.
    SELECT id INTO v_existing_purchase_id
    FROM public.purchases
    WHERE book_id = p_book_id
      AND lower(trim(email)) = lower(trim(v_email))
    LIMIT 1;

    IF v_existing_purchase_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'already_owned', true,
            'purchase_id', v_existing_purchase_id
        );
    END IF;

    -- Canjear cristal (descontar uno disponible).
    v_canje_result := public.canjear_cristal(
        p_clerk_user_id,
        'codice',
        p_book_id
    );

    IF NOT (v_canje_result->>'success')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'error', COALESCE(v_canje_result->>'error', 'canje_failed')
        );
    END IF;

    -- Registrar compra como adquirida vía cristal.
    INSERT INTO public.purchases (
        user_id,
        email,
        book_id,
        formats_purchased,
        purchased_at,
        amount_cents,
        acquired_via
    ) VALUES (
        v_user_id,
        v_email,
        p_book_id,
        p_formats,
        now(),
        0,
        'cristal'
    )
    ON CONFLICT (email, book_id) DO UPDATE
        SET formats_purchased = EXCLUDED.formats_purchased,
            acquired_via = 'cristal',
            purchased_at = now();

    RETURN json_build_object(
        'success', true,
        'already_owned', false,
        'book_id', p_book_id,
        'cristal_id', v_canje_result->>'cristal_id'
    );
END $$;

GRANT EXECUTE ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- 4. RPC: redeem_meditacion_with_cristal
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_meditacion_with_cristal(
    p_clerk_user_id text,
    p_meditacion_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_canje_result json;
    v_existing int;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_meditacion_id IS NULL OR p_meditacion_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'meditacion_id requerido');
    END IF;

    -- Idempotencia: si ya tiene la meditación, OK sin canjear.
    SELECT count(*)::int INTO v_existing
    FROM public.meditaciones_owned
    WHERE clerk_user_id = p_clerk_user_id
      AND meditacion_id = p_meditacion_id;

    IF v_existing > 0 THEN
        RETURN json_build_object(
            'success', true,
            'already_owned', true,
            'meditacion_id', p_meditacion_id
        );
    END IF;

    -- Canjear cristal.
    v_canje_result := public.canjear_cristal(
        p_clerk_user_id,
        'meditacion',
        p_meditacion_id
    );

    IF NOT (v_canje_result->>'success')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'error', COALESCE(v_canje_result->>'error', 'canje_failed')
        );
    END IF;

    INSERT INTO public.meditaciones_owned (
        clerk_user_id,
        meditacion_id,
        acquired_via
    ) VALUES (
        p_clerk_user_id,
        p_meditacion_id,
        'cristal'
    )
    ON CONFLICT (clerk_user_id, meditacion_id) DO NOTHING;

    RETURN json_build_object(
        'success', true,
        'already_owned', false,
        'meditacion_id', p_meditacion_id,
        'cristal_id', v_canje_result->>'cristal_id'
    );
END $$;

GRANT EXECUTE ON FUNCTION public.redeem_meditacion_with_cristal(text, text)
    TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- 5. RPC: get_my_meditaciones_owned
-- Devuelve la lista de IDs de meditaciones que el Tripulante tiene
-- desbloqueadas. Para Tripulantes con Inmersión Solar activa,
-- devolvemos el flag `inmersion_unlocks_all=true` para que el
-- frontend decida no llamar a la lista (todas son libres).
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_meditaciones_owned(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ids text[];
    v_has_inmersion boolean := false;
    v_user_id uuid;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object(
            'meditacion_ids', '[]'::json,
            'inmersion_unlocks_all', false
        );
    END IF;

    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE user_id = v_user_id
              AND status IN ('active', 'trialing')
              AND group_name IN ('cuasar', 'pulsar', 'inmersion')
        ) INTO v_has_inmersion;
    END IF;

    SELECT COALESCE(array_agg(meditacion_id), ARRAY[]::text[])
    INTO v_ids
    FROM public.meditaciones_owned
    WHERE clerk_user_id = p_clerk_user_id;

    RETURN json_build_object(
        'meditacion_ids', to_json(v_ids),
        'inmersion_unlocks_all', v_has_inmersion
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_my_meditaciones_owned(text)
    TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────
-- 6. RPC: get_my_membership_tier
-- Retorna el tier de membresía del Tripulante.
--   'inmersion' → group_name in (cuasar/pulsar/inmersion)
--   'sintonia'  → group_name = 'sintonia'
--   'explorer'  → sin suscripción activa
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_membership_tier(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_group text;
    v_tier text;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('tier', 'explorer', 'group_name', null);
    END IF;

    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('tier', 'explorer', 'group_name', null);
    END IF;

    SELECT group_name INTO v_group
    FROM public.subscriptions
    WHERE user_id = v_user_id
      AND status IN ('active', 'trialing')
    ORDER BY current_period_end DESC NULLS LAST
    LIMIT 1;

    IF v_group IS NULL THEN
        v_tier := 'explorer';
    ELSIF v_group IN ('cuasar', 'pulsar', 'inmersion') THEN
        v_tier := 'inmersion';
    ELSIF v_group = 'sintonia' THEN
        v_tier := 'sintonia';
    ELSE
        v_tier := 'explorer';
    END IF;

    RETURN json_build_object(
        'tier', v_tier,
        'group_name', v_group
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_my_membership_tier(text)
    TO anon, authenticated, service_role;
