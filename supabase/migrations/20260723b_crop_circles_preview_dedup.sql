-- 20260723b_crop_circles_preview_dedup.sql — Crop Circles v2
--
-- Dos cosas, ambas sobre crop_circles (una sola pegada):
--
-- A) MINI-PREVIEW (recorte del patrón): columna nueva preview_crop jsonb
--    {x,y,w,h} (fracciones 0..1 de la foto). La lista de la app pinta ese
--    recorte apretado de la MISMA foto (object-fit); la ficha sigue mostrando
--    la foto entera. Null → la app hace un recorte central por defecto.
--    · get_crop_circles          → devuelve preview_crop.
--    · admin_get_crop_circles    → devuelve preview_crop.
--    · admin_upsert_crop_circle  → acepta p_preview_crop (jsonb, DROP+CREATE):
--        · omitido (SQL NULL)     = no tocar (para Ocultar/Publicar parciales).
--        · objeto con clave 'w'   = guardar ese recorte.
--        · '{}' u otro sin 'w'    = limpiar a NULL (quitar recorte).
--
-- B) DEDUP DEL CRON POR CERCANÍA (no por nombre): las fuentes nombran el mismo
--    sitio distinto ("Stone Circle" = Avebury) y hoy se cuelan como duplicados.
--    Ahora se deduplica por PROXIMIDAD de coordenadas (~2 km) + fecha ±4d,
--    ADEMÁS del nombre (belt & suspenders). Para no PERDER formaciones reales
--    que caen al centroide de un condado (coarse), la proximidad SOLO aplica
--    cuando el geocode del candidato es preciso (p_geo_precise) — el edge lo
--    marca true solo si acertó un sitio de su tabla, false si cayó al condado.
--    · scan_crop_context         → devuelve lat/lng de las formaciones recientes.
--    · scan_insert_crop_circle_draft → +p_geo_precise (DROP+CREATE), dedup ~2km.
--
-- ⚠️ El edge crop-circles-scan DEBE redesplegarse junto con esta migración
--    (llama scan_insert con la firma nueva): supabase functions deploy
--    crop-circles-scan --no-verify-jwt
--
-- Pegar COMPLETO en Supabase Dashboard → SQL Editor → New Query → Run.

-- ═════════════════════════════════════════════════════════════════════
-- A) preview_crop
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE public.crop_circles
    ADD COLUMN IF NOT EXISTS preview_crop jsonb;

-- Lector público (anon): + preview_crop
CREATE OR REPLACE FUNCTION public.get_crop_circles()
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
        SELECT id, title, location_name, country, lat, lng, event_date,
               pattern_kind, decoded_es, decoded_en, image_url, preview_crop
        FROM crop_circles
        WHERE is_published
        ORDER BY event_date DESC, created_at DESC
    ) t;
$$;

-- Lista admin: + preview_crop
CREATE OR REPLACE FUNCTION public.admin_get_crop_circles(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public._is_rsv_admin(p_admin_clerk_id) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT id, title, location_name, country, lat, lng, event_date,
                   pattern_kind, decoded_es, decoded_en, image_url, preview_crop,
                   is_published, notified_at, created_at
            FROM crop_circles
            ORDER BY event_date DESC, created_at DESC
        ) t
    );
END;
$$;

-- Upsert admin: +p_preview_crop al final (DROP la firma vieja de 13 args primero).
DROP FUNCTION IF EXISTS public.admin_upsert_crop_circle(
    text, uuid, text, text, text, double precision, double precision,
    date, text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_upsert_crop_circle(
    p_admin_clerk_id text,
    p_id             uuid DEFAULT NULL,
    p_title          text DEFAULT NULL,
    p_location_name  text DEFAULT NULL,
    p_country        text DEFAULT NULL,
    p_lat            double precision DEFAULT NULL,
    p_lng            double precision DEFAULT NULL,
    p_event_date     date DEFAULT NULL,
    p_pattern_kind   text DEFAULT NULL,
    p_decoded_es     text DEFAULT NULL,
    p_decoded_en     text DEFAULT NULL,
    p_image_url      text DEFAULT NULL,
    p_is_published   boolean DEFAULT NULL,
    p_preview_crop   jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row crop_circles%ROWTYPE;
    v_kind text;
BEGIN
    IF NOT public._is_rsv_admin(p_admin_clerk_id) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_kind := CASE WHEN p_pattern_kind IN ('mandala','spiral','grid','orbits','web','tri')
                   THEN p_pattern_kind ELSE NULL END;

    IF p_id IS NULL THEN
        INSERT INTO crop_circles
            (title, location_name, country, lat, lng, event_date, pattern_kind,
             decoded_es, decoded_en, image_url, is_published, preview_crop)
        VALUES
            (COALESCE(NULLIF(trim(COALESCE(p_title, '')), ''), 'Crop Circle'),
             COALESCE(p_location_name, ''), COALESCE(p_country, ''),
             COALESCE(p_lat, 51.4), COALESCE(p_lng, -1.8),
             COALESCE(p_event_date, CURRENT_DATE), COALESCE(v_kind, 'mandala'),
             COALESCE(p_decoded_es, ''), COALESCE(p_decoded_en, ''),
             p_image_url, COALESCE(p_is_published, false),
             CASE WHEN p_preview_crop ? 'w' THEN p_preview_crop ELSE NULL END)
        RETURNING * INTO v_row;
    ELSE
        UPDATE crop_circles SET
            title         = COALESCE(NULLIF(trim(COALESCE(p_title, '')), ''), title),
            location_name = COALESCE(p_location_name, location_name),
            country       = COALESCE(p_country, country),
            lat           = COALESCE(p_lat, lat),
            lng           = COALESCE(p_lng, lng),
            event_date    = COALESCE(p_event_date, event_date),
            pattern_kind  = COALESCE(v_kind, pattern_kind),
            decoded_es    = COALESCE(p_decoded_es, decoded_es),
            decoded_en    = COALESCE(p_decoded_en, decoded_en),
            image_url     = COALESCE(p_image_url, image_url),
            is_published  = COALESCE(p_is_published, is_published),
            preview_crop  = CASE
                                WHEN p_preview_crop IS NULL THEN preview_crop
                                WHEN p_preview_crop ? 'w'   THEN p_preview_crop
                                ELSE NULL
                            END,
            updated_at    = now()
        WHERE id = p_id
        RETURNING * INTO v_row;
        IF NOT FOUND THEN
            RETURN json_build_object('error', 'not_found');
        END IF;
    END IF;

    RETURN json_build_object('success', true, 'circle', row_to_json(v_row));
END;
$$;

-- ═════════════════════════════════════════════════════════════════════
-- B) Dedup del cron por cercanía de coordenadas (no por nombre)
-- ═════════════════════════════════════════════════════════════════════

-- Contexto para el pre-filtro del edge: + lat/lng de las formaciones recientes
-- (el edge deduplica el candidato contra estas por proximidad + fecha).
CREATE OR REPLACE FUNCTION public.scan_crop_context()
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'slugs', COALESCE(
            (SELECT json_agg(source_slug) FROM crop_circles WHERE source_slug IS NOT NULL),
            '[]'::json),
        'recent', COALESCE(
            (SELECT json_agg(json_build_object(
                's',   lower(regexp_replace(split_part(location_name, ',', 1), '[^a-zA-Z0-9]+', '', 'g')),
                'd',   event_date,
                'lat', lat,
                'lng', lng))
             FROM crop_circles
             WHERE event_date >= (CURRENT_DATE - INTERVAL '150 days')),
            '[]'::json)
    );
$$;

-- Inserta un BORRADOR con dedupe autoritativo por CERCANÍA (~2 km) + fecha,
-- además del nombre. +p_geo_precise (DROP la firma vieja de 11 args primero).
DROP FUNCTION IF EXISTS public.scan_insert_crop_circle_draft(
    text, text, text, text, double precision, double precision,
    date, text, text, text, text);

CREATE OR REPLACE FUNCTION public.scan_insert_crop_circle_draft(
    p_source_slug   text,
    p_title         text,
    p_location_name text,
    p_country       text,
    p_lat           double precision,
    p_lng           double precision,
    p_event_date    date,
    p_pattern_kind  text,
    p_decoded_es    text,
    p_decoded_en    text,
    p_image_url     text,
    p_geo_precise   boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row   crop_circles%ROWTYPE;
    v_kind  text;
    v_site  text;
BEGIN
    -- Idempotencia del cron: ya insertamos exactamente esta formación.
    IF p_source_slug IS NOT NULL AND EXISTS (
        SELECT 1 FROM crop_circles WHERE source_slug = p_source_slug
    ) THEN
        RETURN json_build_object('inserted', false, 'reason', 'slug_exists');
    END IF;

    -- Dedupe cruzado (siembra / panel / otra fuente) dentro de fecha ±4d por:
    --   (a) CERCANÍA de coordenadas ~2 km — SOLO si el geocode es preciso
    --       (acertó un sitio real). Si cayó al centroide de un condado
    --       (p_geo_precise=false) NO se usa proximidad, para no rechazar por
    --       error dos formaciones distintas que comparten centroide (favorecer
    --       agregar sobre perder). Distancia equirectangular (equirect approx).
    --   (b) NOMBRE contenido — respaldo cuando la proximidad no aplica o los
    --       geocodes difieren pero el nombre coincide.
    v_site := lower(regexp_replace(split_part(COALESCE(p_location_name, ''), ',', 1),
                                   '[^a-zA-Z0-9]+', '', 'g'));
    IF EXISTS (
        SELECT 1 FROM crop_circles cc
        WHERE abs(cc.event_date - p_event_date) <= 4
          AND (
            -- (a) proximidad ~2 km (geocode preciso)
            (
                COALESCE(p_geo_precise, false)
                AND p_lat IS NOT NULL AND p_lng IS NOT NULL
                AND 111.195 * sqrt(
                        power(cc.lat - p_lat, 2)
                      + power((cc.lng - p_lng) * cos(radians((cc.lat + p_lat) / 2.0)), 2)
                    ) <= 2.0
            )
            OR
            -- (b) nombre contenido (guard de longitud ≥4)
            (
                length(v_site) >= 4
                AND (
                    strpos(lower(regexp_replace(split_part(cc.location_name, ',', 1),
                                                '[^a-zA-Z0-9]+', '', 'g')), v_site) > 0
                    OR strpos(v_site, lower(regexp_replace(split_part(cc.location_name, ',', 1),
                                                           '[^a-zA-Z0-9]+', '', 'g'))) > 0
                )
            )
          )
    ) THEN
        RETURN json_build_object('inserted', false, 'reason', 'dup_proximity_or_name');
    END IF;

    v_kind := CASE WHEN p_pattern_kind IN ('mandala','spiral','grid','orbits','web','tri')
                   THEN p_pattern_kind ELSE 'mandala' END;

    INSERT INTO crop_circles
        (title, location_name, country, lat, lng, event_date, pattern_kind,
         decoded_es, decoded_en, image_url, is_published, source_slug)
    VALUES
        (COALESCE(NULLIF(trim(COALESCE(p_title, '')), ''), 'Crop Circle'),
         COALESCE(p_location_name, ''), COALESCE(p_country, 'Reino Unido'),
         COALESCE(p_lat, 51.4), COALESCE(p_lng, -1.8),
         COALESCE(p_event_date, CURRENT_DATE), v_kind,
         COALESCE(p_decoded_es, ''), COALESCE(p_decoded_en, ''),
         p_image_url, false, p_source_slug)
    RETURNING * INTO v_row;

    RETURN json_build_object('inserted', true, 'id', v_row.id);
EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('inserted', false, 'reason', 'slug_race');
END;
$$;

-- ═════════════════════════════════════════════════════════════════════
-- Permisos (patrón de la casa)
-- ═════════════════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION public.admin_get_crop_circles(text)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_upsert_crop_circle(text, uuid, text, text, text, double precision, double precision, date, text, text, text, text, boolean, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.scan_crop_context()                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.scan_insert_crop_circle_draft(text, text, text, text, double precision, double precision, date, text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_crop_circles(text)           TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_crop_circle(text, uuid, text, text, text, double precision, double precision, date, text, text, text, text, boolean, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.scan_crop_context()                    TO service_role;
GRANT EXECUTE ON FUNCTION public.scan_insert_crop_circle_draft(text, text, text, text, double precision, double precision, date, text, text, text, text, boolean) TO service_role;

-- El lector del catálogo SÍ queda público (sin PII, solo publicados).
GRANT EXECUTE ON FUNCTION public.get_crop_circles() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
