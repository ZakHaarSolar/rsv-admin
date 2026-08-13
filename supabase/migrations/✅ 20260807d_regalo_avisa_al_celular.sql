-- Red Solar Viva · EL REGALO AVISA AL CELULAR (2026-08-07)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente. Misma firma → NO requiere redeploy de admin-action.
--
-- 🜂 EL AGUJERO (Zak): al regalar Sintonía Solar el Tripulante recibía la
-- celebración SOLO si volvía a abrir la app por su cuenta. Si no la abría, el
-- regalo se quedaba esperando en silencio, y un regalo que nadie sabe que
-- existe no es un regalo. El resto del ecosistema (mensajes, ciclo del Radar,
-- crop circles nuevos) ya avisa al teléfono; esto no.
--
-- LA CURA: `admin_offer_gift_sintonia` dispara el push por el MISMO camino que
-- los DM (_push_dispatch → send-push → APNs/FCM). El `type` viaja como 'gift',
-- que es el que la app ya sabe rutear: al tocarlo abre la celebración
-- directamente (PushSync → __rsvPendingGift → rsv-open-gift).
--
-- El push NO se dispara si el regalo ya estaba pendiente (idempotencia: no se
-- insiste con la misma persona cada vez que se toca el botón), y si el nodo no
-- tiene notificaciones registradas la helper simplemente no hace nada.

BEGIN;

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
    v_lang     text := 'es';
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

    -- Idempotente: si ya hay un regalo pendiente, no duplicar NI volver a
    -- avisar (insistir con la misma persona se siente acoso, no regalo).
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

    /* Idioma del aparato del nodo (push_tokens.lang, que ya llena
       register_push_token desde 20260805): se habla en el idioma de quien
       lee, igual que el aviso del ciclo del Radar. */
    SELECT lower(left(coalesce(nullif(trim(p.lang), ''), 'es'), 2))
      INTO v_lang
      FROM push_tokens p
     WHERE p.clerk_user_id = p_target_clerk_id
     ORDER BY p.updated_at DESC NULLS LAST
     LIMIT 1;
    IF v_lang IS NULL OR v_lang <> 'en' THEN v_lang := 'es'; END IF;

    /* 🜂 El aviso al teléfono. `type: gift` ya lo rutea PushSync → abre la
       celebración directamente, no el Radar. Si el nodo no registró
       notificaciones, _push_dispatch no hace nada y el regalo sigue vivo
       esperándolo dentro de la app. */
    PERFORM public._push_dispatch(
        p_target_clerk_id,
        CASE WHEN v_lang = 'en' THEN 'A gift for you' ELSE 'Un regalo para ti' END,
        CASE WHEN v_lang = 'en'
             THEN 'Zak''Haar sent you a month of Sintonía Solar. Open it here.'
             ELSE 'Zak''Haar te envió un mes de Sintonía Solar. Ábrelo aquí.'
        END,
        jsonb_build_object('type', 'gift', 'gift_id', v_new_id::text)
    );

    RETURN jsonb_build_object('success', true, 'gift_id', v_new_id, 'push', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_offer_gift_sintonia(text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_offer_gift_sintonia(text, text)
    TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
