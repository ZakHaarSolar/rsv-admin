-- Red Solar Viva · Motor de Intervención · admin gift Sintonía Solar
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- RPC para que un admin active manualmente Sintonía Solar a otro
-- Tripulante por 30 días. Inserta una row en `subscriptions` con
-- `stripe_subscription_id` sintético (`gift_sintonia_<clerk_id>_<epoch>`)
-- y `cancel_at_period_end=true` para que NO se renueve sola al pasar
-- el mes. La membresía se comporta como cualquier otra activa: pasa
-- los gates de Sintonía Solar en el frontend (escáner, decodificador,
-- Calibraciones, etc.). No genera fila en Stripe (cero ingreso
-- registrado, cero invoice generada).
--
-- Comportamiento del frontend:
--   · MiNucleo.useNucleoData → get_user_subscription → devuelve la
--     row más reciente, así que la nueva membresía gift se ve
--     activa.
--   · Estado Orbital muestra "Sintonía Solar" + fecha de expiración.
--   · Cuando current_period_end pasa, el frontend deja de tratarla
--     como activa (status sigue 'active' pero la fecha vence). En la
--     próxima iteración se puede limpiar con un cron job o RPC de
--     cancelación si hace falta.
--
-- Re-aplicación: se puede invocar varias veces sobre el mismo target.
-- Cada invocación inserta una row nueva (subscriptions.id distinto,
-- stripe_subscription_id distinto por el epoch). El frontend toma la
-- más reciente por current_period_end DESC.

DROP FUNCTION IF EXISTS public.admin_activate_sintonia(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_activate_sintonia(
    p_admin_clerk_id TEXT,
    p_target_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_email TEXT;
    v_target_user_id UUID;
    v_target_name TEXT;
    v_now TIMESTAMPTZ := now();
    v_period_end TIMESTAMPTZ := now() + interval '30 days';
    v_synthetic_sub_id TEXT;
BEGIN
    /* Admin gate. Alias `ap` para no chocar con columnas de profiles
       leídas más abajo. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles ap
        WHERE ap.clerk_user_id = p_admin_clerk_id
          AND ap.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    /* Cargar datos del target. */
    SELECT
        COALESCE(p.email, ''),
        p.id,
        COALESCE(p.full_name, '')
    INTO v_target_email, v_target_user_id, v_target_name
    FROM profiles p
    WHERE p.clerk_user_id = p_target_clerk_id
    LIMIT 1;

    IF v_target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tripulante no encontrado en profiles'
        );
    END IF;

    /* ID sintético único (incluye epoch para idempotencia múltiple).
       El prefijo `gift_sintonia_` permite diferenciar de subs reales
       de Stripe (que arrancan con `sub_`). */
    v_synthetic_sub_id := 'gift_sintonia_'
        || p_target_clerk_id
        || '_'
        || (EXTRACT(EPOCH FROM v_now)::BIGINT)::TEXT;

    /* Insertar la subscription. cancel_at_period_end=true para que
       el frontend muestre "no se renueva" y la membresía expire al
       pasar el mes. */
    INSERT INTO subscriptions (
        user_id,
        email,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        customer_name,
        group_name
    ) VALUES (
        v_target_user_id,
        NULLIF(v_target_email, ''),
        v_synthetic_sub_id,
        NULL,
        'active',
        v_now,
        v_period_end,
        true,
        NULLIF(v_target_name, ''),
        'sintonia'
    );

    RETURN jsonb_build_object(
        'success', true,
        'sub_id', v_synthetic_sub_id,
        'expires_at', v_period_end::TEXT,
        'target_email', v_target_email
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_activate_sintonia(TEXT, TEXT)
    TO anon, authenticated;
