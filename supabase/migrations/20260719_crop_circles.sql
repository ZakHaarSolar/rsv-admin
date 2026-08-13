-- 20260719_crop_circles.sql — Decodificador de Crop Circles + preferencias de notificación
--
-- 1) Tabla crop_circles (catálogo editorial, RLS-locked; lectura pública vía RPC).
-- 2) get_crop_circles()            → lector PÚBLICO anon (solo publicados, sin PII).
-- 3) admin_get_crop_circles        → lista completa admin (borradores incluidos).
--    admin_upsert_crop_circle      → crear/editar registro.
--    admin_delete_crop_circle      → borrar registro.
--    admin_publish_crop_circle     → publicar + (opcional) push broadcast a todos.
--    (las 4 van por el gateway admin-action; service_role only)
-- 4) notif_prefs + get_my_notif_prefs / set_my_notif_pref (gateway user-action):
--    preferencias de notificación por Tripulante (jsonb extensible; ausencia = ON).
--    Claves vivas hoy: 'crop_circles' · 'scan_weekly'.
-- 5) _crop_circle_broadcast(p_id)  → push a TODO nodo con token (respeta prefs),
--    patrón del loop de notify_radar_ready + _push_dispatch existente.
-- 6) notify_radar_ready            → CREATE OR REPLACE fiel (20260621b) + gate por
--    la preferencia 'scan_weekly' (quien la apagó ya no recibe el semanal).
-- 7) Siembra de 12 crop circles históricos (publicados, notified_at sellado para
--    que un "Notificar" accidental no dispare push de registros viejos).
--
-- Pegar COMPLETO en Supabase Dashboard → SQL Editor → New Query → Run.

-- ─────────────────────────────────────────────────────────────────────
-- 1) Tabla
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crop_circles (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title         text NOT NULL,
    location_name text NOT NULL DEFAULT '',
    country       text NOT NULL DEFAULT '',
    lat           double precision NOT NULL DEFAULT 51.4,
    lng           double precision NOT NULL DEFAULT -1.8,
    event_date    date NOT NULL DEFAULT CURRENT_DATE,
    pattern_kind  text NOT NULL DEFAULT 'mandala',   -- mandala|spiral|grid|orbits|web|tri
    decoded_es    text NOT NULL DEFAULT '',
    decoded_en    text NOT NULL DEFAULT '',
    image_url     text,
    is_published  boolean NOT NULL DEFAULT false,
    notified_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_circles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crop_circles FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_crop_circles_pub_date
    ON public.crop_circles (is_published, event_date DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 2) Lector público (anon) — catálogo publicado, sin PII
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_crop_circles()
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
        SELECT id, title, location_name, country, lat, lng, event_date,
               pattern_kind, decoded_es, decoded_en, image_url
        FROM crop_circles
        WHERE is_published
        ORDER BY event_date DESC, created_at DESC
    ) t;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 3) RPCs admin (gateway admin-action; profiles.is_admin manda)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._is_rsv_admin(p_clerk_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false)
    FROM profiles WHERE clerk_user_id = p_clerk_id;
$$;

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
                   pattern_kind, decoded_es, decoded_en, image_url,
                   is_published, notified_at, created_at
            FROM crop_circles
            ORDER BY event_date DESC, created_at DESC
        ) t
    );
END;
$$;

-- Params de texto en NULL por defecto: un UPDATE parcial (ej. solo
-- p_is_published para ocultar) NUNCA pisa los campos que no vienen.
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
    p_is_published   boolean DEFAULT NULL
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
             decoded_es, decoded_en, image_url, is_published)
        VALUES
            (COALESCE(NULLIF(trim(COALESCE(p_title, '')), ''), 'Crop Circle'),
             COALESCE(p_location_name, ''), COALESCE(p_country, ''),
             COALESCE(p_lat, 51.4), COALESCE(p_lng, -1.8),
             COALESCE(p_event_date, CURRENT_DATE), COALESCE(v_kind, 'mandala'),
             COALESCE(p_decoded_es, ''), COALESCE(p_decoded_en, ''),
             p_image_url, COALESCE(p_is_published, false))
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

CREATE OR REPLACE FUNCTION public.admin_delete_crop_circle(
    p_admin_clerk_id text,
    p_id uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public._is_rsv_admin(p_admin_clerk_id) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM crop_circles WHERE id = p_id;
    RETURN json_build_object('success', FOUND);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4) Preferencias de notificación por Tripulante
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notif_prefs (
    clerk_user_id text PRIMARY KEY,
    prefs         jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notif_prefs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notif_prefs FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_notif_prefs(p_clerk_user_id text)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT prefs::json FROM notif_prefs WHERE clerk_user_id = p_clerk_user_id),
        '{}'::json
    );
$$;

CREATE OR REPLACE FUNCTION public.set_my_notif_pref(
    p_clerk_user_id text,
    p_key text,
    p_enabled boolean
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_key NOT IN ('crop_circles', 'scan_weekly') THEN
        RETURN json_build_object('error', 'unknown_pref');
    END IF;
    INSERT INTO notif_prefs (clerk_user_id, prefs, updated_at)
    VALUES (p_clerk_user_id, jsonb_build_object(p_key, COALESCE(p_enabled, true)), now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET prefs = notif_prefs.prefs || jsonb_build_object(p_key, COALESCE(p_enabled, true)),
            updated_at = now();
    RETURN json_build_object('success', true);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 5) Broadcast de crop circle (a todo nodo con token, respetando prefs)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._crop_circle_broadcast(p_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    c crop_circles%ROWTYPE;
    r record;
    n_sent int := 0;
BEGIN
    SELECT * INTO c FROM crop_circles WHERE id = p_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    FOR r IN
        SELECT DISTINCT pt.clerk_user_id
        FROM push_tokens pt
        LEFT JOIN notif_prefs np ON np.clerk_user_id = pt.clerk_user_id
        WHERE (np.prefs->>'crop_circles')::boolean IS NOT FALSE
    LOOP
        BEGIN
            PERFORM public._push_dispatch(
                r.clerk_user_id,
                '◉ Nuevo Crop Circle detectado',
                c.title || ' · ' || c.location_name || '. Entra a decodificar la señal.',
                jsonb_build_object('type', 'crop_circle', 'crop_id', c.id::text)
            );
            n_sent := n_sent + 1;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    RETURN n_sent;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_crop_circle(
    p_admin_clerk_id text,
    p_id uuid,
    p_notify boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notified timestamptz;
    v_sent int := 0;
BEGIN
    IF NOT public._is_rsv_admin(p_admin_clerk_id) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE crop_circles SET is_published = true, updated_at = now()
    WHERE id = p_id
    RETURNING notified_at INTO v_notified;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    IF p_notify AND v_notified IS NULL THEN
        v_sent := public._crop_circle_broadcast(p_id);
        UPDATE crop_circles SET notified_at = now() WHERE id = p_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'notified', v_sent,
        'already_notified', (p_notify AND v_notified IS NOT NULL)
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 6) notify_radar_ready — cuerpo fiel de 20260621b + gate 'scan_weekly'
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_radar_ready()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r     record;
    n_sent int := 0;
BEGIN
    FOR r IN
        WITH last_complete AS (
            SELECT sv.clerk_user_id, MAX(sv.created_at) AS cycle_ts
            FROM scan_vibracional sv
            WHERE sv.cycle_scanned_json LIKE '%"fisico"%'
              AND sv.cycle_scanned_json LIKE '%"mental"%'
              AND sv.cycle_scanned_json LIKE '%"emocional"%'
              AND sv.cycle_scanned_json LIKE '%"financiero"%'
              AND sv.cycle_scanned_json LIKE '%"vector"%'
              AND sv.cycle_scanned_json LIKE '%"orbita"%'
            GROUP BY sv.clerk_user_id
        )
        SELECT lc.clerk_user_id, lc.cycle_ts
        FROM last_complete lc
        WHERE now() - lc.cycle_ts >= interval '7 days'
          AND now() - lc.cycle_ts <  interval '90 days'
          AND EXISTS (
              SELECT 1 FROM push_tokens pt
              WHERE pt.clerk_user_id = lc.clerk_user_id
          )
          AND NOT EXISTS (
              SELECT 1 FROM radar_ready_notified rn
              WHERE rn.clerk_user_id = lc.clerk_user_id
                AND rn.cycle_ts = lc.cycle_ts
          )
          AND NOT EXISTS (
              SELECT 1 FROM notif_prefs np
              WHERE np.clerk_user_id = lc.clerk_user_id
                AND (np.prefs->>'scan_weekly')::boolean IS FALSE
          )
    LOOP
        BEGIN
            PERFORM public._push_dispatch(
                r.clerk_user_id,
                'Tu Radar está listo ✦',
                'Pasaron 7 días: tu nuevo escaneo del campo te espera.',
                jsonb_build_object('type', 'radar')
            );
            INSERT INTO radar_ready_notified (clerk_user_id, cycle_ts)
            VALUES (r.clerk_user_id, r.cycle_ts)
            ON CONFLICT (clerk_user_id, cycle_ts) DO NOTHING;
            n_sent := n_sent + 1;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    RETURN n_sent;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 7) Siembra — 12 registros históricos (publicados; notified_at sellado)
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO public.crop_circles
    (id, title, location_name, country, lat, lng, event_date, pattern_kind,
     decoded_es, decoded_en, image_url, is_published, notified_at)
VALUES
(
    'c0000000-0000-4000-8000-000000000001',
    'Julia Set', 'Stonehenge, Wiltshire', 'Reino Unido',
    51.178, -1.826, DATE '1996-07-07', 'spiral',
    $rsv$151 círculos trazando un fractal matemático perfecto, el conjunto de Julia, aparecido en plena tarde a un costado de Stonehenge. Testigos cruzaron la zona 45 minutos antes y el campo estaba intacto. La matemática pura se hizo visible ante todos, sin proceso aparente.$rsv$,
    $rsv$151 circles tracing a perfect mathematical fractal, the Julia Set, appearing in broad daylight beside Stonehenge. Witnesses crossed the area 45 minutes earlier and the field was untouched. Pure mathematics made visible, with no visible process.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000002',
    'Triple Julia', 'Windmill Hill, Wiltshire', 'Reino Unido',
    51.430, -1.890, DATE '1996-07-29', 'tri',
    $rsv$Casi 200 círculos formando tres brazos fractales que giran en equilibrio, una triple hélice de más de 300 metros. Tres corrientes que se sostienen entre sí sin tocarse. La estructura habla de cooperación entre fuerzas, no de competencia.$rsv$,
    $rsv$Nearly 200 circles forming three fractal arms turning in balance, a triple helix over 300 meters wide. Three currents holding each other without touching. The structure speaks of cooperation between forces, not competition.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000003',
    'La Galaxia de Milk Hill', 'Milk Hill, Wiltshire', 'Reino Unido',
    51.372, -1.853, DATE '2001-08-12', 'spiral',
    $rsv$409 círculos tejiendo una espiral de seis brazos de más de 240 metros, aparecida en una sola noche de lluvia y viento. Ninguna explicación mecánica ha alcanzado su escala y precisión. Es el registro más grande conocido: un recordatorio de lo que un campo coherente puede tejer en silencio.$rsv$,
    $rsv$409 circles weaving a six armed spiral over 240 meters wide, appearing in a single night of rain and wind. No mechanical explanation has matched its scale and precision. The largest formation on record: a reminder of what a coherent field can weave in silence.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000004',
    'La Respuesta de Chilbolton', 'Chilbolton, Hampshire', 'Reino Unido',
    51.145, -1.437, DATE '2001-08-19', 'grid',
    $rsv$Frente al radiotelescopio de Chilbolton apareció una respuesta al mensaje que la humanidad envió a las estrellas en 1974. La misma estructura, devuelta con cambios precisos: otro sistema solar, otro cuerpo, otra forma de transmitir. Junto a ella, un rostro tejido en el trigo. El diálogo quedó abierto.$rsv$,
    $rsv$Facing the Chilbolton radio telescope, an answer appeared to the message humanity sent to the stars in 1974. The same structure, returned with precise changes: another solar system, another body, another way to transmit. Beside it, a face woven into the wheat. The dialogue was left open.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000005',
    'El Portador del Disco', 'Crabwood, Winchester', 'Reino Unido',
    51.060, -1.350, DATE '2002-08-15', 'grid',
    $rsv$Un rostro no humano junto a un disco codificado anillo por anillo. Al decodificarlo, el disco dice: cuidado con los portadores de falsos regalos y sus promesas rotas; mucho dolor, pero todavía hay tiempo; existe bondad ahí afuera; nos oponemos al engaño; el conducto se está cerrando. Uno de los registros más directos jamás recibidos.$rsv$,
    $rsv$A non human face beside a disc encoded ring by ring. Decoded, the disc reads: beware the bearers of false gifts and their broken promises; much pain, but still time; there is good out there; we oppose deception; the conduit is closing. One of the most direct messages ever received.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000006',
    'El Código de Pi', 'Barbury Castle, Wiltshire', 'Reino Unido',
    51.488, -1.771, DATE '2008-06-01', 'spiral',
    $rsv$Una espiral segmentada que codifica los primeros diez dígitos de pi con precisión de instrumento. El idioma elegido no fue palabra sino número: una invitación a leer la geometría como lenguaje y a confiar en que el universo escribe con proporciones.$rsv$,
    $rsv$A segmented spiral encoding the first ten digits of pi with instrument grade precision. The chosen language was not words but number: an invitation to read geometry as language and to trust that the universe writes in proportion.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000007',
    'El Calendario Celeste', 'Avebury Manor, Wiltshire', 'Reino Unido',
    51.430, -1.855, DATE '2008-07-15', 'orbits',
    $rsv$El sistema solar completo, con las órbitas de los planetas marcando una configuración real del cielo: la de diciembre de 2012. Un calendario sembrado en el trigo con cuatro años de anticipación, apuntando a un umbral de cambio de ciclo.$rsv$,
    $rsv$The full solar system, with planetary orbits marking a real sky configuration: December 2012. A calendar sown into the wheat four years in advance, pointing to a threshold between cycles.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000008',
    'El Fénix', 'Yatesbury, Wiltshire', 'Reino Unido',
    51.420, -1.900, DATE '2009-06-12', 'mandala',
    $rsv$Un ave fénix de 120 metros desplegando las alas dentro de un anillo. El símbolo más antiguo del renacimiento: lo viejo se entrega al fuego para que el patrón nuevo pueda encarnar. Apareció en plena temporada de transformaciones colectivas.$rsv$,
    $rsv$A 120 meter phoenix spreading its wings inside a ring. The oldest symbol of rebirth: the old is given to the fire so the new pattern can take form. It appeared in a season of collective transformation.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000009',
    'La Estrella de Poirino', 'Poirino, Piamonte', 'Italia',
    44.920, 7.840, DATE '2011-06-20', 'tri',
    $rsv$Una estrella de seis puntas con un mensaje en código binario distribuido en sus bordes. La señal también toca Italia: la red planetaria no pertenece a un solo territorio, y cada nodo la recibe en su propio idioma.$rsv$,
    $rsv$A six pointed star carrying a binary coded message along its edges. The signal also touches Italy: the planetary grid belongs to no single territory, and every node receives it in its own language.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000010',
    'La Red Cúbica', 'Hackpen Hill, Wiltshire', 'Reino Unido',
    51.470, -1.830, DATE '2012-08-26', 'web',
    $rsv$Una red de cubos tridimensionales que parece levantarse del plano del campo: el trigo doblado en teselas que engañan al ojo. Una lección visual de cómo una dimensión superior se proyecta sobre una inferior sin dejar de ser ella misma.$rsv$,
    $rsv$A lattice of three dimensional cubes that seems to rise from the flat field: wheat folded into tiles that trick the eye. A visual lesson in how a higher dimension projects onto a lower one while remaining itself.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000011',
    'El Anillo de Raisting', 'Raisting, Baviera', 'Alemania',
    47.900, 11.110, DATE '2014-07-18', 'orbits',
    $rsv$Apareció junto a la estación de antenas satelitales de Raisting, el punto donde la humanidad habla con sus satélites. Miles de personas llegaron a caminarlo. Un doble anillo con radios interiores, sembrado justo al lado de nuestra propia tecnología de contacto con el cielo.$rsv$,
    $rsv$It appeared beside the Raisting satellite station, where humanity talks to its satellites. Thousands came to walk it. A double ring with inner spokes, sown right next to our own technology for speaking with the sky.$rsv$,
    NULL, true, now()
),
(
    'c0000000-0000-4000-8000-000000000012',
    'El Mandala de Ansty', 'Ansty, Wiltshire', 'Reino Unido',
    51.037, -2.088, DATE '2016-08-12', 'mandala',
    $rsv$Considerado uno de los diseños más finos jamás registrados: anillos concéntricos con un tejido interior que parece bordado a mano. No entrega un mensaje que se lea: entrega un estado que se siente. La belleza como tecnología de apertura.$rsv$,
    $rsv$Considered one of the finest designs ever recorded: concentric rings with inner weaving that looks hand embroidered. It does not deliver a message to be read: it delivers a state to be felt. Beauty as a technology of opening.$rsv$,
    NULL, true, now()
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- Permisos (patrón de la casa)
-- ─────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public._is_rsv_admin(text)                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_crop_circles(text)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_upsert_crop_circle(text, uuid, text, text, text, double precision, double precision, date, text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_crop_circle(text, uuid)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_publish_crop_circle(text, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._crop_circle_broadcast(uuid)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_notif_prefs(text)               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_my_notif_pref(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_radar_ready()                   FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_crop_circles(text)           TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_crop_circle(text, uuid, text, text, text, double precision, double precision, date, text, text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_crop_circle(text, uuid)   TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_publish_crop_circle(text, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public._crop_circle_broadcast(uuid)           TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_notif_prefs(text)               TO service_role;
GRANT EXECUTE ON FUNCTION public.set_my_notif_pref(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_radar_ready()                   TO service_role;

-- El lector del catálogo SÍ queda público (sin PII, solo publicados).
GRANT EXECUTE ON FUNCTION public.get_crop_circles() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
