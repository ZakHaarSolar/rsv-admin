-- Red Solar Viva · REALIDAD ELEGIDA — vision board del Escáner
-- =====================================================================
-- 20260712b_realidad_elegida.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action v1.36 (suma get_my_vision / upsert_vision_answer /
-- delete_vision_answer / seal_vision / add_vision_photo /
-- delete_vision_photo / reanchor_vision al whitelist) + edge upload-vision
-- (fotos a R2) + EV_RealidadElegida.tsx (capa nueva del Radar).
--
-- Qué es: la capa donde el Tripulante ANCLA su realidad soñada — la
-- describe por ángulos mapeados a los 6 pilares (voz en presente), la
-- NOMBRA, y sube fotos que flotan como constelación. La visión se vuelve
-- el NORTE del instrumento. Contemplación diaria = ritual del Sendero
-- (activity_key 'contemplacion_realidad' → Fotones vía toggle_ritual).
--
-- PRIVACIDAD (innegociable — precedentes: sueños, Espejo, Rachas, DMs):
--   · El contenido es ÍNTIMO (ingresos, cuerpo, vínculos, sueños de vida).
--   · TODO texto del Tripulante (nombre de la visión, respuestas, ángulos
--     propios) + las URLs de sus fotos se guardan CIFRADOS EN REPOSO
--     (pgcrypto + llave propia en Supabase Vault, patrón de los DMs).
--     Un volcado de estas tablas sale ilegible; la llave no viaja en un
--     pg_dump. 100% defensivo: sin Vault degrada a texto plano SIN romper.
--   · NUNCA visible por-nodo en paneles admin. El Motor solo verá
--     AGREGADOS anónimos (fase 2).
--
-- Freemium (server-side, la verdad vive aquí; el cliente solo pre-gatea):
--   · CREAR la visión (ángulos + nombre + sello) = LIBRE para todos.
--   · SIN membresía → hasta 3 fotos.
--   · Con Sintonía/Inmersión (_is_active_member) → fotos ilimitadas
--     (tope 60 anti-abuso) + re-anclar guardando versiones con fecha.
--   · La Contemplación diaria se gatea en el CLIENTE (Sintonía) — el
--     ritual 'contemplacion_realidad' vive en el catálogo como los demás.
--
-- Tablas RLS-locked SIN policies → solo accesibles vía las RPCs SECURITY
-- DEFINER, ruteadas por el gateway user-action (inyecta el p_clerk_user_id
-- verificado del token; el del cliente se descarta).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ── Llave propia en el Vault (una sola vez; aleatoria de 256 bits) ──
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'vision_key') THEN
        PERFORM vault.create_secret(
            encode(gen_random_bytes(32), 'hex'),
            'vision_key',
            'Llave de cifrado en reposo de la Realidad Elegida (vision board)'
        );
    END IF;
END $$;

-- ── Tablas ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vision_board (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL UNIQUE,
    nombre        text NOT NULL DEFAULT '',   -- cifrado si enc=true
    enc           boolean NOT NULL DEFAULT false,
    sellada_at    timestamptz,                -- NULL = ceremonia sin sellar
    version_count int NOT NULL DEFAULT 0,     -- re-anclajes guardados
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vision_answers (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    angle_key     text NOT NULL,              -- fisico|mental|emocional|financiero|vector|orbita|custom_<id>
    pilar         text NOT NULL DEFAULT '',   -- '' | uno de los 6 (customs pueden mapearse en fase 2)
    prompt_custom text NOT NULL DEFAULT '',   -- pregunta propia (cifrada si enc)
    body          text NOT NULL DEFAULT '',   -- la respuesta (cifrada si enc)
    enc           boolean NOT NULL DEFAULT false,
    sort_order    int NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (clerk_user_id, angle_key)
);
CREATE INDEX IF NOT EXISTS idx_vision_answers_user
    ON public.vision_answers (clerk_user_id);

CREATE TABLE IF NOT EXISTS public.vision_photos (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    url           text NOT NULL,              -- URL R2 (cifrada si enc)
    enc           boolean NOT NULL DEFAULT false,
    angle_key     text NOT NULL DEFAULT '',   -- ángulo opcional al que pertenece
    sort_order    int NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vision_photos_user
    ON public.vision_photos (clerk_user_id);

-- Versiones ancladas (re-anclar = Sintonía): snapshot COMPLETO cifrado.
CREATE TABLE IF NOT EXISTS public.vision_versions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    payload       text NOT NULL,              -- json del snapshot (cifrado si enc)
    enc           boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vision_versions_user
    ON public.vision_versions (clerk_user_id);

ALTER TABLE public.vision_board    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_photos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_versions ENABLE ROW LEVEL SECURITY;
-- (Sin policies → cero acceso anon/authenticated; solo service_role vía RPC.)

-- ── Ritual del Sendero: Contemplación diaria (Fotones vía toggle_ritual) ──
INSERT INTO public.daily_ritual_catalog
    (activity_key, label, points, requires_text, active, sort_order)
VALUES
    ('contemplacion_realidad', 'Contemplación de mi Realidad', 10, false, true, 112)
ON CONFLICT (activity_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- Helpers de cifrado (patrón _dm_key/_dm_decrypt de los DMs, llave propia).
-- Defensivos: sin Vault la llave sale NULL y todo degrada a texto plano
-- sin romper la capa.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._vision_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    SELECT decrypted_secret INTO k
    FROM vault.decrypted_secrets WHERE name = 'vision_key' LIMIT 1;
    RETURN k;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;  -- sin Vault → cifrado deshabilitado, la capa sigue
END $$;

CREATE OR REPLACE FUNCTION public._vision_encrypt(
    p_text text,
    OUT o_text text,
    OUT o_enc  boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    o_text := p_text;
    o_enc  := false;
    IF p_text IS NULL OR p_text = '' THEN RETURN; END IF;
    k := public._vision_key();
    IF k IS NULL THEN RETURN; END IF;
    BEGIN
        o_text := armor(pgp_sym_encrypt(p_text, k));
        o_enc  := true;
    EXCEPTION WHEN OTHERS THEN
        o_text := p_text;
        o_enc  := false;
    END;
END $$;

CREATE OR REPLACE FUNCTION public._vision_decrypt(p_text text, p_enc boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    IF p_text IS NULL OR NOT COALESCE(p_enc, false) THEN
        RETURN p_text;
    END IF;
    k := public._vision_key();
    IF k IS NULL THEN RETURN p_text; END IF;
    RETURN pgp_sym_decrypt(dearmor(p_text), k);
EXCEPTION WHEN OTHERS THEN
    RETURN p_text;  -- nunca rompe la capa: peor caso, devuelve lo crudo
END $$;

-- ── Helpers fila → json (descifran al vuelo; una sola forma) ────────
CREATE OR REPLACE FUNCTION public._vision_answer_to_json(a public.vision_answers)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',            a.id,
        'angle_key',     a.angle_key,
        'pilar',         a.pilar,
        'prompt_custom', public._vision_decrypt(a.prompt_custom, a.enc),
        'body',          public._vision_decrypt(a.body, a.enc),
        'sort_order',    a.sort_order,
        'created_at',    a.created_at,
        'updated_at',    a.updated_at
    );
$$;

CREATE OR REPLACE FUNCTION public._vision_photo_to_json(p public.vision_photos)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',         p.id,
        'url',        public._vision_decrypt(p.url, p.enc),
        'angle_key',  p.angle_key,
        'sort_order', p.sort_order,
        'created_at', p.created_at
    );
$$;

-- ════════════════════════════════════════════════════════════════════
-- Lectura: mi visión completa (board + respuestas + fotos + membresía)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_vision(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member boolean;
    v_board  public.vision_board;
    v_bjson  json := NULL;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    v_member := public._is_active_member(p_clerk_user_id);

    SELECT * INTO v_board
    FROM public.vision_board WHERE clerk_user_id = p_clerk_user_id;
    IF FOUND THEN
        v_bjson := json_build_object(
            'id',            v_board.id,
            'nombre',        public._vision_decrypt(v_board.nombre, v_board.enc),
            'sellada_at',    v_board.sellada_at,
            'version_count', v_board.version_count,
            'created_at',    v_board.created_at
        );
    END IF;

    RETURN json_build_object(
        'is_member',        v_member,
        'free_photo_limit', 3,
        'max_photos',       60,
        'board',            v_bjson,
        'answers', COALESCE((
            SELECT json_agg(public._vision_answer_to_json(a)
                            ORDER BY a.sort_order, a.created_at)
            FROM public.vision_answers a
            WHERE a.clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'photos', COALESCE((
            SELECT json_agg(public._vision_photo_to_json(p)
                            ORDER BY p.sort_order, p.created_at)
            FROM public.vision_photos p
            WHERE p.clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    );
END $$;

-- ════════════════════════════════════════════════════════════════════
-- Anclar/actualizar la respuesta de UN ángulo (cifra al guardar).
-- Un ángulo con cuerpo vacío se BORRA (pasar/limpiar = soltar el ángulo).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.upsert_vision_answer(
    p_clerk_user_id text,
    p_angle_key     text,
    p_pilar         text DEFAULT '',
    p_prompt_custom text DEFAULT '',
    p_body          text DEFAULT '',
    p_sort_order    int  DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_angle  text := LEFT(COALESCE(TRIM(p_angle_key), ''), 60);
    v_pilar  text := CASE
                        WHEN COALESCE(p_pilar,'') IN
                            ('fisico','mental','emocional','financiero','vector','orbita')
                        THEN p_pilar ELSE '' END;
    v_prompt text := LEFT(COALESCE(TRIM(p_prompt_custom), ''), 200);
    v_body   text := LEFT(COALESCE(TRIM(p_body), ''), 4000);
    v_count  int;
    e_prompt record;
    e_body   record;
    v_enc    boolean;
    v_store_prompt text;
    v_store_body   text;
    v_row    public.vision_answers;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF v_angle = '' THEN
        RETURN json_build_object('error', 'empty_angle');
    END IF;

    -- Cuerpo vacío = soltar el ángulo (idempotente).
    IF v_body = '' THEN
        DELETE FROM public.vision_answers
        WHERE clerk_user_id = p_clerk_user_id AND angle_key = v_angle;
        RETURN json_build_object('ok', true, 'deleted', true);
    END IF;

    -- Cap anti-abuso de ángulos totales (6 default + propios de sobra).
    SELECT count(*)::int INTO v_count
    FROM public.vision_answers
    WHERE clerk_user_id = p_clerk_user_id AND angle_key <> v_angle;
    IF v_count >= 24 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    -- Cifrado en reposo (best-effort). Un solo flag por fila → prompt y
    -- cuerpo cifran juntos o quedan en claro juntos.
    e_body         := public._vision_encrypt(v_body);
    v_enc          := e_body.o_enc;
    v_store_body   := e_body.o_text;
    v_store_prompt := v_prompt;
    IF v_enc AND v_prompt <> '' THEN
        e_prompt := public._vision_encrypt(v_prompt);
        IF e_prompt.o_enc THEN
            v_store_prompt := e_prompt.o_text;
        ELSE
            -- El prompt no cifró → guardar AMBOS en claro (flag coherente).
            v_enc          := false;
            v_store_body   := v_body;
            v_store_prompt := v_prompt;
        END IF;
    END IF;

    INSERT INTO public.vision_answers
        (clerk_user_id, angle_key, pilar, prompt_custom, body, enc, sort_order)
    VALUES (
        p_clerk_user_id,
        v_angle,
        v_pilar,
        v_store_prompt,
        v_store_body,
        v_enc,
        COALESCE(p_sort_order, 0)
    )
    ON CONFLICT (clerk_user_id, angle_key) DO UPDATE SET
        pilar         = EXCLUDED.pilar,
        prompt_custom = EXCLUDED.prompt_custom,
        body          = EXCLUDED.body,
        enc           = EXCLUDED.enc,
        sort_order    = EXCLUDED.sort_order,
        updated_at    = now()
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'answer', public._vision_answer_to_json(v_row));
END $$;

-- ── Soltar un ángulo ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_vision_answer(
    p_clerk_user_id text,
    p_angle_key     text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM public.vision_answers
    WHERE clerk_user_id = p_clerk_user_id
      AND angle_key = COALESCE(TRIM(p_angle_key), '');
    RETURN json_build_object('ok', true, 'deleted', FOUND);
END $$;

-- ════════════════════════════════════════════════════════════════════
-- SELLAR la visión: la nombra y fija sellada_at (cifra el nombre).
-- Crear la visión es LIBRE (freemium: el muro vive en Contemplación,
-- fotos 4+ y re-anclar).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.seal_vision(
    p_clerk_user_id text,
    p_nombre        text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre text := LEFT(COALESCE(TRIM(p_nombre), ''), 80);
    e_nom    record;
    v_row    public.vision_board;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF v_nombre = '' THEN
        RETURN json_build_object('error', 'empty_name');
    END IF;

    e_nom := public._vision_encrypt(v_nombre);

    INSERT INTO public.vision_board (clerk_user_id, nombre, enc, sellada_at)
    VALUES (p_clerk_user_id, e_nom.o_text, e_nom.o_enc, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        nombre     = EXCLUDED.nombre,
        enc        = EXCLUDED.enc,
        sellada_at = now(),
        updated_at = now()
    RETURNING * INTO v_row;

    RETURN json_build_object(
        'ok', true,
        'board', json_build_object(
            'id',            v_row.id,
            'nombre',        v_nombre,
            'sellada_at',    v_row.sellada_at,
            'version_count', v_row.version_count,
            'created_at',    v_row.created_at
        )
    );
END $$;

-- ════════════════════════════════════════════════════════════════════
-- Fotos de la constelación (URL cifrada; freemium 3 libres server-side)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.add_vision_photo(
    p_clerk_user_id text,
    p_url           text,
    p_angle_key     text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_url    text := LEFT(COALESCE(TRIM(p_url), ''), 600);
    v_count  int;
    v_member boolean;
    e_url    record;
    v_row    public.vision_photos;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF v_url = '' OR v_url !~* '^https://' THEN
        RETURN json_build_object('error', 'invalid_url');
    END IF;

    SELECT count(*)::int INTO v_count
    FROM public.vision_photos WHERE clerk_user_id = p_clerk_user_id;

    v_member := public._is_active_member(p_clerk_user_id);
    IF NOT v_member AND v_count >= 3 THEN
        RETURN json_build_object('error', 'limit_free');
    END IF;
    IF v_count >= 60 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    e_url := public._vision_encrypt(v_url);

    INSERT INTO public.vision_photos
        (clerk_user_id, url, enc, angle_key, sort_order)
    VALUES (
        p_clerk_user_id, e_url.o_text, e_url.o_enc,
        LEFT(COALESCE(TRIM(p_angle_key), ''), 60), v_count
    )
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'photo', public._vision_photo_to_json(v_row));
END $$;

CREATE OR REPLACE FUNCTION public.delete_vision_photo(
    p_clerk_user_id text,
    p_id            uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM public.vision_photos
    WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('ok', true, 'deleted', FOUND);
END $$;

-- ════════════════════════════════════════════════════════════════════
-- RE-ANCLAR (Sintonía): guarda un snapshot COMPLETO con fecha (la visión
-- de julio vs hoy) y deja la visión viva lista para evolucionar. No
-- borra nada: el cliente reabre la ceremonia con los textos cargados.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.reanchor_vision(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member  boolean;
    v_board   public.vision_board;
    v_payload text;
    e_pay     record;
    v_n       int;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    v_member := public._is_active_member(p_clerk_user_id);
    IF NOT v_member THEN
        RETURN json_build_object('error', 'members_only');
    END IF;

    SELECT * INTO v_board
    FROM public.vision_board WHERE clerk_user_id = p_clerk_user_id;
    IF NOT FOUND OR v_board.sellada_at IS NULL THEN
        RETURN json_build_object('error', 'no_vision');
    END IF;

    -- Snapshot descifrado → un solo blob → re-cifrado como versión.
    v_payload := json_build_object(
        'nombre',     public._vision_decrypt(v_board.nombre, v_board.enc),
        'sellada_at', v_board.sellada_at,
        'answers', COALESCE((
            SELECT json_agg(public._vision_answer_to_json(a)
                            ORDER BY a.sort_order, a.created_at)
            FROM public.vision_answers a
            WHERE a.clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'photos', COALESCE((
            SELECT json_agg(public._vision_photo_to_json(p)
                            ORDER BY p.sort_order, p.created_at)
            FROM public.vision_photos p
            WHERE p.clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    )::text;

    e_pay := public._vision_encrypt(v_payload);

    INSERT INTO public.vision_versions (clerk_user_id, payload, enc)
    VALUES (p_clerk_user_id, e_pay.o_text, e_pay.o_enc);

    UPDATE public.vision_board
    SET version_count = version_count + 1, updated_at = now()
    WHERE clerk_user_id = p_clerk_user_id
    RETURNING version_count INTO v_n;

    RETURN json_build_object('ok', true, 'version_count', v_n);
END $$;

-- ── Locks (patrón canónico: nada para anon/authenticated; gateway only) ──
REVOKE ALL ON FUNCTION public._vision_key()                                                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vision_encrypt(text)                                            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vision_decrypt(text, boolean)                                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vision_answer_to_json(public.vision_answers)                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vision_photo_to_json(public.vision_photos)                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_vision(text)                                              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_vision_answer(text, text, text, text, text, int)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_vision_answer(text, text)                                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seal_vision(text, text)                                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_vision_photo(text, text, text)                               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_vision_photo(text, uuid)                                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reanchor_vision(text)                                            FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._vision_key()                                                  TO service_role;
GRANT EXECUTE ON FUNCTION public._vision_encrypt(text)                                          TO service_role;
GRANT EXECUTE ON FUNCTION public._vision_decrypt(text, boolean)                                 TO service_role;
GRANT EXECUTE ON FUNCTION public._vision_answer_to_json(public.vision_answers)                  TO service_role;
GRANT EXECUTE ON FUNCTION public._vision_photo_to_json(public.vision_photos)                    TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_vision(text)                                            TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_vision_answer(text, text, text, text, text, int)        TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_vision_answer(text, text)                               TO service_role;
GRANT EXECUTE ON FUNCTION public.seal_vision(text, text)                                        TO service_role;
GRANT EXECUTE ON FUNCTION public.add_vision_photo(text, text, text)                             TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_vision_photo(text, uuid)                                TO service_role;
GRANT EXECUTE ON FUNCTION public.reanchor_vision(text)                                          TO service_role;

NOTIFY pgrst, 'reload schema';
