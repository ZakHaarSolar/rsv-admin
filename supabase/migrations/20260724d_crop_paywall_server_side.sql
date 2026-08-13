-- ═══════════════════════════════════════════════════════════════════════
-- 20260724d_crop_paywall_server_side.sql
-- Auditoría de seguridad 2026-07-24 · HALLAZGO ALTA (bypass de paywall)
--
-- ⚠️ REQUIERE DECISIÓN DE ZAK ANTES DE PEGAR. Cambia el contrato que
--    consume EV_CropCircles.tsx → hay que migrar el cliente en la misma
--    tanda (ver § CLIENTE al final). NO pegar sola.
--
-- PROBLEMA
-- El muro de Crop Circles (3 decodificaciones de por vida, construido el
-- 2026-07-24) es COSMÉTICO: `get_crop_circles()` es anon y devuelve
-- `decoded_es` + `decoded_en` de las 121 formaciones en el mismo listado
-- público. El velo de glifos y el botón DESCIFRAR son solo UI: el texto
-- ya viajó al dispositivo. `record_crop_decode` únicamente CUENTA; nunca
-- decide si se puede leer.
--
-- Verificado EN VIVO con la anon key (2026-07-24):
--   POST /rest/v1/rpc/get_crop_circles {}  → HTTP 200
--   121 filas · 121 con decoded_es no vacío
--   columnas: id, title, location_name, country, lat, lng, event_date,
--             pattern_kind, decoded_es, decoded_en, image_url, preview_crop
--
-- Cualquiera con la llave pública (que viaja en el bundle) se lleva las
-- 121 decodificaciones sin cuenta, sin app y sin suscripción.
--
-- FIX (respeta el diseño de Zak: el REGISTRO es libre para siempre —
-- planeta, años, ficha, foto, patrón — y lo que se paga es el SIGNIFICADO)
--   1. `get_crop_circles()` deja de emitir decoded_*. Todo lo demás sigue
--      anon: el planeta, la banda de años, la lista y las fichas no
--      cambian ni un pixel.
--   2. Nace `get_crop_decode(p_clerk_user_id, p_crop_id)`: entrega el
--      texto SOLO si el Tripulante es miembro, o si ya lo había descifrado,
--      o si le quedan cupos de los 3 de por vida — y en ese último caso
--      consume el cupo ATÓMICAMENTE en la misma llamada. Va por el gateway
--      `user-action`, que inyecta el id verificado del token.
--
-- Con esto el muro deja de ser un velo y pasa a ser el servidor.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. El listado público pierde el significado ─────────────────────────
-- Idéntica a la de 20260723b (mismo patrón row_to_json + mismo ORDER BY,
-- para que el orden de la lista y del planeta no cambie ni un pixel);
-- lo ÚNICO que sale del SELECT es decoded_es / decoded_en.
CREATE OR REPLACE FUNCTION public.get_crop_circles()
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
        SELECT id, title, location_name, country, lat, lng, event_date,
               pattern_kind, image_url, preview_crop,
               -- MÁSCARA del velo de glifos: mismo largo y mismos espacios
               -- que la lectura real, con TODO carácter sustituido por 'x'.
               -- El velo conserva su ritmo exacto (se ve que HAY una lectura
               -- y cuánta) sin que viaje una sola letra del texto.
               regexp_replace(COALESCE(decoded_es, ''), '[^[:space:]]', 'x', 'g')
                   AS decoded_mask
        FROM crop_circles
        WHERE is_published
        ORDER BY event_date DESC, created_at DESC
    ) t;
$$;

-- El listado sigue siendo público (el registro es libre para siempre).
REVOKE ALL ON FUNCTION public.get_crop_circles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_crop_circles()
    TO anon, authenticated, service_role;

-- ── 2. El significado, server-authoritative ─────────────────────────────
-- Devuelve { ok, decoded_es, decoded_en, count, remaining, reason }.
-- reason: 'member' | 'already' | 'granted' | 'wall' | 'bad_input' | 'not_found'
CREATE OR REPLACE FUNCTION public.get_crop_decode(
    p_clerk_user_id TEXT,
    p_crop_id       UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_free_limit CONSTANT INT := 3;
    v_member   BOOLEAN;
    v_already  BOOLEAN;
    v_count    INT;
    v_es       TEXT;
    v_en       TEXT;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' OR p_crop_id IS NULL THEN
        RETURN json_build_object('ok', false, 'reason', 'bad_input');
    END IF;

    SELECT decoded_es, decoded_en INTO v_es, v_en
    FROM public.crop_circles
    WHERE id = p_crop_id AND is_published = true;
    IF NOT FOUND THEN
        RETURN json_build_object('ok', false, 'reason', 'not_found');
    END IF;

    v_member := public._is_active_member(p_clerk_user_id);

    SELECT EXISTS (
        SELECT 1 FROM public.crop_decodes
        WHERE clerk_user_id = p_clerk_user_id AND crop_id = p_crop_id
    ) INTO v_already;

    -- Miembro: acceso total. Se registra igual (telemetría), sin consumir.
    IF v_member THEN
        INSERT INTO public.crop_decodes (clerk_user_id, crop_id)
        VALUES (p_clerk_user_id, p_crop_id)
        ON CONFLICT (clerk_user_id, crop_id) DO NOTHING;
        RETURN json_build_object(
            'ok', true, 'reason', 'member',
            'decoded_es', v_es, 'decoded_en', v_en,
            'remaining', NULL
        );
    END IF;

    -- Ya lo había descifrado: re-abrir NUNCA consume otra.
    IF v_already THEN
        SELECT COUNT(*)::INT INTO v_count
        FROM public.crop_decodes WHERE clerk_user_id = p_clerk_user_id;
        RETURN json_build_object(
            'ok', true, 'reason', 'already',
            'decoded_es', v_es, 'decoded_en', v_en,
            'count', v_count,
            'remaining', GREATEST(v_free_limit - v_count, 0)
        );
    END IF;

    -- Cupo libre: se consume ATÓMICAMENTE (el INSERT es la reserva; el
    -- índice único (clerk_user_id, crop_id) evita la doble concesión en
    -- llamadas concurrentes).
    SELECT COUNT(*)::INT INTO v_count
    FROM public.crop_decodes WHERE clerk_user_id = p_clerk_user_id;

    IF v_count >= v_free_limit THEN
        RETURN json_build_object(
            'ok', false, 'reason', 'wall',
            'count', v_count, 'remaining', 0
        );
    END IF;

    INSERT INTO public.crop_decodes (clerk_user_id, crop_id)
    VALUES (p_clerk_user_id, p_crop_id)
    ON CONFLICT (clerk_user_id, crop_id) DO NOTHING;

    SELECT COUNT(*)::INT INTO v_count
    FROM public.crop_decodes WHERE clerk_user_id = p_clerk_user_id;

    RETURN json_build_object(
        'ok', true, 'reason', 'granted',
        'decoded_es', v_es, 'decoded_en', v_en,
        'count', v_count,
        'remaining', GREATEST(v_free_limit - v_count, 0)
    );
END;
$$;

-- Solo el gateway: el id lo pone el servidor desde el token verificado.
REVOKE ALL ON FUNCTION public.get_crop_decode(TEXT, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_crop_decode(TEXT, UUID) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════
-- § GATEWAY  (admin/supabase/functions/user-action/index.ts)
--   Sumar a USER_RPCS:   get_crop_decode: "p_clerk_user_id",
--   Redesplegar:         supabase functions deploy user-action --no-verify-jwt
--
-- § CLIENTE (escaner-app/src/components/escaner/EV_CropCircles.tsx)
--   Hoy la ficha lee `circle.decoded_es` (línea ~2526), que ya no llega.
--   Al tocar DESCIFRAR debe llamar userAction("get_crop_decode",
--   { p_crop_id: circle.id }) y pintar la respuesta:
--     · ok=true  → mostrar decoded_es/decoded_en + actualizar el contador
--                  con `remaining`
--     · ok=false, reason='wall' → levantar el muro (EV_Freemium kind 'crop')
--   El velo de glifos y la animación de DESCIFRAR no cambian: solo cambia
--   DE DÓNDE sale el texto. La capa aún NO viajó en un build de App Store,
--   así que el cambio no rompe a ningún usuario real.
-- ═══════════════════════════════════════════════════════════════════════
