-- 20260716_redeem_codice_formatos_union.sql — CANJE POR FORMATO (audiolibro).
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: Co_Mobile v1.9 (pastilla "DESBLOQUEAR · Audiolibro"). NO toca el
-- gateway: `redeem_codice_with_cristal` ya está en el whitelist de user-action.
--
-- POR QUÉ (dos bugs que bloqueaban el audiolibro):
--
--   1) FALSO "ya lo tienes". La versión previa cortaba con already_owned si
--      existía CUALQUIER compra del libro, sin mirar los formatos. Un
--      Tripulante con el PDF+Ebook de La Voz de Gaia pedía el audiolibro y la
--      RPC le respondía "already_owned" sin concedérselo → el audiolibro era
--      inalcanzable para quien ya tenía el libro.
--
--   2) FORMATOS PISADOS. El ON CONFLICT hacía
--      `formats_purchased = EXCLUDED.formats_purchased` (REEMPLAZO). Canjear el
--      audiolibro habría dejado formats_purchased = {audiolibro}, BORRANDO el
--      pdf y el epub ya adquiridos → el Tripulante perdía sus descargas.
--
-- QUÉ HACE AHORA:
--   · already_owned SOLO si los formatos pedidos YA están todos (p_formats <@
--     formats_purchased). Si falta alguno, cobra 1 Cristal y lo SUMA.
--   · El ON CONFLICT hace UNIÓN sin duplicados (dedupe + orden estable), así
--     PDF+Ebook y Audiolibro conviven en la misma fila de purchases.
--
-- Efecto de negocio: cada formato cuesta su Cristal (o su compra suelta), y el
-- Tripulante nunca pierde lo que ya tenía. Idempotente (CREATE OR REPLACE, la
-- firma externa no cambia → grants intactos).

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
    v_existing_formats text[];
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
        RETURN json_build_object('success', false, 'error', 'profile_not_found');
    END IF;

    -- ¿Ya hay compra de este libro? Traemos también SUS FORMATOS.
    SELECT id, COALESCE(formats_purchased, ARRAY[]::text[])
      INTO v_existing_purchase_id, v_existing_formats
    FROM public.purchases
    WHERE book_id = p_book_id::uuid
      AND lower(trim(email)) = lower(trim(v_email))
    LIMIT 1;

    -- already_owned SOLO si los formatos pedidos ya están TODOS presentes.
    -- `<@` = "contenido en". Si falta alguno (ej. pide audiolibro y solo tiene
    -- pdf+epub) seguimos y le cobramos su Cristal por el formato nuevo.
    IF v_existing_purchase_id IS NOT NULL
       AND p_formats <@ v_existing_formats THEN
        RETURN json_build_object(
            'success', true,
            'already_owned', true,
            'purchase_id', v_existing_purchase_id,
            'formats', v_existing_formats
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

    -- Registrar / ampliar la compra. UNIÓN de formatos: nunca pisa lo ya
    -- adquirido (el Tripulante conserva pdf/epub al sumar audiolibro).
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
        SET formats_purchased = ARRAY(
                SELECT DISTINCT f
                FROM unnest(
                    COALESCE(public.purchases.formats_purchased, ARRAY[]::text[])
                    || EXCLUDED.formats_purchased
                ) AS f
                ORDER BY f
            ),
            acquired_via = 'cristal',
            purchased_at = now();

    RETURN json_build_object(
        'success', true,
        'already_owned', false,
        'book_id', p_book_id,
        'formats', p_formats,
        'cristal_id', v_canje_result->>'cristal_id'
    );
END $$;

-- Lock canónico: gateway-only (user-action inyecta el clerk_user_id verificado).
REVOKE ALL ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    TO service_role;

NOTIFY pgrst, 'reload schema';
