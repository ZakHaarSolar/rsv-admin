-- 20260430_redeem_codice_uuid_cast.sql
-- Fix del canje de Códice por Cristal.
--
-- Síntomas: el cliente recibía http_404 al pegarle a la RPC
-- redeem_codice_with_cristal aunque la firma estaba bien registrada
-- y los grants estaban OK.
--
-- Causas raíz (dos, encadenadas):
--   1. La versión deployada perdió el `SET search_path = public` al
--      inicio. PostgREST traduce el "function does not exist" interno
--      (referencias a public.purchases y public.canjear_cristal sin
--      schema resuelto) como 404 hacia el cliente.
--   2. La columna purchases.book_id es uuid, pero el RPC trataba
--      p_book_id como text en el WHERE y en el INSERT. Postgres no
--      hace cast implícito de text a uuid → la query interna fallaba
--      con error de tipo.
--
-- Fix mínimo: re-deploy del RPC con `SET search_path = public` +
-- cast `::uuid` en las dos referencias a p_book_id que tocan
-- purchases.book_id. La firma externa se preserva (text, text, text[])
-- así que CREATE OR REPLACE alcanza — no se hace DROP, los grants
-- y dependencias se mantienen.

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

    -- Resolver perfil.
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
    -- p_book_id viene como text en la firma; purchases.book_id es uuid → cast.
    SELECT id INTO v_existing_purchase_id
    FROM public.purchases
    WHERE book_id = p_book_id::uuid
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
    -- Cast a uuid para insertar en purchases.book_id.
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
        p_book_id::uuid,
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
