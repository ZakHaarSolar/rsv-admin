-- Red Solar Viva · AUDITORÍA · PARTE 3 · CIFRADO EN REPOSO (2/2 — el round-trip)
-- BITÁCORA DE COHERENCIA · CONTADOR DE RACHAS · BÓVEDA DE SUEÑOS
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere que 20260724j_cifrado_helpers_intimo.sql YA esté pegada (crea la
-- llave `priv_content_key` en Vault y los helpers _priv_encrypt/_priv_decrypt).
--
-- NO requiere build de iOS ni deploy de ninguna edge. El cliente no cambia:
-- las RPC siguen devolviendo exactamente el mismo JSON, con las mismas claves.
--
-- ── ORDEN DE EJECUCIÓN (es el orden del archivo; NO lo alteres) ──────────────
--   1) columnas `enc`      → nadie cifrado todavía, cero cambio visible
--   2) RPC de lectura      → ya descifran (sobre datos en claro son un no-op)
--   3) triggers            → lo NUEVO nace cifrado y se lee bien por (2)
--   4) BACKFILL al final   → lo VIEJO se cifra y se lee bien por (2)
-- Cifrar antes de re-crear las lectoras dejaría a la gente viendo texto cifrado.
-- El archivo es idempotente: re-correrlo entero no hace daño ni doble-cifra.
--
-- ── POR QUÉ CASI NINGUNA RPC SE TOCA (y por qué eso importa) ─────────────────
-- El cifrado va en TRIGGERS de escritura (transparentes: `upsert_nota`,
-- `create_racha`, `complete_dream_job`… conservan su cuerpo intacto) y el
-- descifrado solo en las funciones que LEEN texto. Así el round-trip se reduce
-- a 5 funciones en vez de 18, y ninguna de las que aplican límites freemium,
-- rachas, historial o estado de job se reescribe. Menos superficie, menos riesgo.
--
-- ⚠️ LA CONSULTA QUE TE PEDÍ TENÍA UN HUECO. Filtraba por nombre
-- (`proname LIKE '%bitacora%'`) y las RPC de la Bitácora NO se llaman así: son
-- get_my_notas / upsert_nota / delete_nota / _nota_to_json. Por eso volvieron
-- vacías. Tampoco salieron create_dream_job / complete_dream_job / get_dream_job,
-- que tocan dream_records sin llevar "dream_record" en el nombre.
-- La consulta correcta filtra por DEPENDENCIA, no por nombre:
--
--   SELECT p.proname, pg_get_functiondef(p.oid)
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND pg_get_functiondef(p.oid) ~* '(bitacora_notas|dream_records|public\.rachas)'
--   ORDER BY p.proname;
--
-- De las 5 funciones que este archivo re-crea, 3 vienen de tu pegado (cuerpo
-- VIVO, verificado): _racha_to_json, admin_get_rachas_anon, get_my_dream_records.
-- Las otras 2 (_nota_to_json, get_dream_job) tienen UNA sola definición en todo
-- el repo y nunca fueron re-creadas después, así que el archivo ES el vigente.
-- Si quieres certeza total, corre la consulta de arriba antes de pegar y avísame
-- solo si `_nota_to_json` o `get_dream_job` difieren de lo que hay aquí.
--
-- ── QUÉ SE CIFRA ─────────────────────────────────────────────────────────────
--   bitacora_notas : title, body                (el diario personal)
--   rachas         : title                      (confesionales por diseño)
--   dream_records  : dream_text, dictamen_vibral,
--                    calibracion_quirurgica, custom_title
--
-- QUEDA EN CLARO A PROPÓSITO (son llaves de lógica o etiquetas categóricas,
-- no contenido íntimo, y cifrarlas rompería filtros o pintaría mal la UI):
--   · bitacora_notas.tag        → la carpeta; el cliente agrupa por ella
--   · dream_records.banda_key   → llave de lógica del dictamen
--   · dream_records.banda_frecuencial → nombre de la banda ("Purga de Entropía")
--   · dream_records.status / is_lucid / seen_at
--
-- ── NO DEJA CIEGO A NINGÚN BUSCADOR (verificado) ────────────────────────────
-- Los dos buscadores filtran EN EL CLIENTE sobre el texto ya descifrado:
--   · Bitácora  → EV_Bitacora.tsx (notas.filter sobre title/body)
--   · Alimentos → EV_Decoder.tsx  (tabla distinta, ni se toca)
-- No hay ILIKE ni to_tsvector contra estas columnas en el servidor.
--
-- Helpers defensivos: si el Vault no responde, _priv_encrypt devuelve el texto
-- tal cual (enc=false) y _priv_decrypt lo pasa de largo. El cifrado nunca puede
-- dejar a nadie sin acceso a su propio contenido.

BEGIN;

-- =============================================================================
-- 0) Guardia: sin los helpers de 20260724j esto no debe correr a medias.
-- =============================================================================
DO $$
BEGIN
    IF to_regprocedure('public._priv_decrypt(text, boolean)') IS NULL
       OR to_regprocedure('public._priv_encrypt(text)') IS NULL THEN
        RAISE EXCEPTION
            'Faltan los helpers de cifrado. Pega primero 20260724j_cifrado_helpers_intimo.sql';
    END IF;
END $$;

-- Detector de "ya está cifrado". Hace los triggers IDEMPOTENTES: si el valor
-- entrante ya viene armado (por el backfill, o por un UPDATE que reescribe la
-- misma columna sin tocarla), no se vuelve a cifrar. Exige AMBOS marcadores
-- para que un texto que casualmente empiece así no engañe al detector.
CREATE OR REPLACE FUNCTION public._priv_is_armored(p_text text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_text IS NOT NULL
       AND length(p_text) > 60
       AND left(p_text, 27) = '-----BEGIN PGP MESSAGE-----'
       AND p_text LIKE '%-----END PGP MESSAGE-----%';
$$;
REVOKE ALL ON FUNCTION public._priv_is_armored(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._priv_is_armored(text) TO service_role;

-- =============================================================================
-- 1) COLUMNAS `enc` — primero, y nada más. Todo queda en claro (enc=false).
-- =============================================================================
ALTER TABLE public.bitacora_notas ADD COLUMN IF NOT EXISTS enc boolean NOT NULL DEFAULT false;
ALTER TABLE public.rachas         ADD COLUMN IF NOT EXISTS enc boolean NOT NULL DEFAULT false;
ALTER TABLE public.dream_records  ADD COLUMN IF NOT EXISTS enc boolean NOT NULL DEFAULT false;

-- =============================================================================
-- 2) RPC DE LECTURA re-creadas (descifran al vuelo).
--    Sobre datos en claro (enc=false) _priv_decrypt devuelve el texto tal cual,
--    así que este paso NO cambia nada de lo que ve el Tripulante hoy.
--    Cada CREATE OR REPLACE re-afirma su candado (un replace re-otorga a PUBLIC).
-- =============================================================================

-- ── 2.1) BITÁCORA · _nota_to_json — el ÚNICO punto de lectura del texto.
--        get_my_notas y upsert_nota la usan y NO se tocan.
CREATE OR REPLACE FUNCTION public._nota_to_json(n public.bitacora_notas)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',         n.id,
        'title',      public._priv_decrypt(n.title, n.enc),
        'body',       public._priv_decrypt(n.body,  n.enc),
        'tag',        n.tag,
        'pinned',     n.pinned,
        'favorite',   n.favorite,
        'created_at', n.created_at,
        'updated_at', n.updated_at
    );
$$;
REVOKE ALL ON FUNCTION public._nota_to_json(public.bitacora_notas) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._nota_to_json(public.bitacora_notas) TO service_role;

-- ── 2.2) RACHAS · _racha_to_json — cuerpo VIVO de tu pegado, + descifrado.
--        get_my_rachas / create_racha / update_racha / reset_racha /
--        toggle_racha_pause devuelven por aquí y NO se tocan.
CREATE OR REPLACE FUNCTION public._racha_to_json(r public.rachas)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',           r.id,
        'title',        public._priv_decrypt(r.title, r.enc),
        'started_at',   r.started_at,
        'best_seconds', r.best_seconds,
        'created_at',   r.created_at,
        'history',      COALESCE(r.history, '[]'::jsonb),
        'paused_at',    r.paused_at
    );
$$;
REVOKE ALL ON FUNCTION public._racha_to_json(public.rachas) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._racha_to_json(public.rachas) TO service_role;

-- ── 2.3) RACHAS · admin_get_rachas_anon — cuerpo VIVO de tu pegado. Es la
--        ÚNICA función admin que lee el título (la del Padrón solo lee números).
--        Sigue siendo anónima: título + días, sin identidad.
CREATE OR REPLACE FUNCTION public.admin_get_rachas_anon(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN json_build_object(
        'total', COALESCE((SELECT COUNT(*)::int FROM rachas), 0),
        'nodos', COALESCE((
            SELECT COUNT(DISTINCT clerk_user_id)::int FROM rachas
        ), 0),
        'members', COALESCE((
            SELECT COUNT(*)::int FROM rachas r
            WHERE public._is_active_member(r.clerk_user_id)
        ), 0),
        -- Lista anónima: título + días + miembro. SIN clerk_user_id, SIN
        -- correo, SIN alias. Orden: las rachas más largas primero.
        'rachas', COALESCE((
            SELECT json_agg(row_json ORDER BY days DESC)
            FROM (
                SELECT
                    json_build_object(
                        'title', public._priv_decrypt(r.title, r.enc),
                        'days', FLOOR(GREATEST(0, EXTRACT(EPOCH FROM (now() - r.started_at))) / 86400)::int,
                        'is_member', public._is_active_member(r.clerk_user_id)
                    ) AS row_json,
                    FLOOR(GREATEST(0, EXTRACT(EPOCH FROM (now() - r.started_at))) / 86400)::int AS days
                FROM rachas r
                ORDER BY days DESC
                LIMIT 300
            ) sub
        ), '[]'::json)
    );
END $function$;
REVOKE ALL ON FUNCTION public.admin_get_rachas_anon(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_rachas_anon(text) TO service_role;

-- ── 2.4) SUEÑOS · get_my_dream_records — cuerpo VIVO de tu pegado (incluye
--        is_lucid), + descifrado de los 4 campos de texto. La Bóveda.
CREATE OR REPLACE FUNCTION public.get_my_dream_records(
    target_clerk_id text,
    p_limit integer DEFAULT 100
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN '[]'::json;
    END IF;
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT id, created_at, status,
               public._priv_decrypt(dream_text, enc)             AS dream_text,
               banda_frecuencial, banda_key,
               public._priv_decrypt(dictamen_vibral, enc)        AS dictamen_vibral,
               public._priv_decrypt(calibracion_quirurgica, enc) AS calibracion_quirurgica,
               public._priv_decrypt(custom_title, enc)           AS custom_title,
               is_lucid
        FROM dream_records
        WHERE clerk_user_id = target_clerk_id
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500))
    ) r;
    RETURN result;
END;
$function$;
-- 🜂 CRÍTICO: este replace re-otorgaría a anon lo que 20260620n cerró (era la
-- fuga del texto íntegro de los sueños). Se llama por el gateway user-action.
REVOKE EXECUTE ON FUNCTION public.get_my_dream_records(text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_dream_records(text, integer) TO service_role;

-- ── 2.5) SUEÑOS · get_dream_job — el poll del cliente mientras se decodifica.
--        Lee el dictamen, así que también descifra. (No estaba en tu pegado
--        porque su nombre no matcheaba el filtro; cuerpo vigente = 20260623.)
CREATE OR REPLACE FUNCTION public.get_dream_job(
    target_clerk_id text,
    p_record_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3
       OR p_record_id IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT row_to_json(r) INTO result
    FROM (
        SELECT id, created_at, status, banda_frecuencial, banda_key,
               public._priv_decrypt(dictamen_vibral, enc)        AS dictamen_vibral,
               public._priv_decrypt(calibracion_quirurgica, enc) AS calibracion_quirurgica,
               public._priv_decrypt(custom_title, enc)           AS custom_title
        FROM dream_records
        WHERE id = p_record_id AND clerk_user_id = target_clerk_id
        LIMIT 1
    ) r;
    RETURN result;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_dream_job(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_dream_job(text, uuid) TO service_role;

-- =============================================================================
-- 3) TRIGGERS — cifran al escribir. Ninguna RPC de escritura se modifica.
--    Idempotentes: si el valor ya viene armado, lo dejan pasar y marcan enc.
-- =============================================================================

-- ── 3.1) BITÁCORA
CREATE OR REPLACE FUNCTION public._priv_bitacora_encrypt_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_txt text;
    v_ok  boolean;
    v_any boolean := false;
BEGIN
    IF NEW.title IS NOT NULL AND NEW.title <> '' THEN
        IF public._priv_is_armored(NEW.title) THEN
            v_any := true;
        ELSE
            SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.title);
            IF v_ok THEN NEW.title := v_txt; v_any := true; END IF;
        END IF;
    END IF;

    IF NEW.body IS NOT NULL AND NEW.body <> '' THEN
        IF public._priv_is_armored(NEW.body) THEN
            v_any := true;
        ELSE
            SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.body);
            IF v_ok THEN NEW.body := v_txt; v_any := true; END IF;
        END IF;
    END IF;

    IF v_any THEN NEW.enc := true; END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;  -- nunca rompe el guardado de una nota
END $$;

DROP TRIGGER IF EXISTS bitacora_notas_encrypt ON public.bitacora_notas;
CREATE TRIGGER bitacora_notas_encrypt
    BEFORE INSERT OR UPDATE OF title, body ON public.bitacora_notas
    FOR EACH ROW EXECUTE FUNCTION public._priv_bitacora_encrypt_tg();

-- ── 3.2) RACHAS
CREATE OR REPLACE FUNCTION public._priv_rachas_encrypt_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_txt text;
    v_ok  boolean;
BEGIN
    IF NEW.title IS NULL OR NEW.title = '' THEN RETURN NEW; END IF;
    IF public._priv_is_armored(NEW.title) THEN
        NEW.enc := true;
        RETURN NEW;
    END IF;
    SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.title);
    IF v_ok THEN
        NEW.title := v_txt;
        NEW.enc   := true;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rachas_encrypt ON public.rachas;
CREATE TRIGGER rachas_encrypt
    BEFORE INSERT OR UPDATE OF title ON public.rachas
    FOR EACH ROW EXECUTE FUNCTION public._priv_rachas_encrypt_tg();

-- ── 3.3) SUEÑOS (4 columnas; create_dream_job escribe el texto y
--        complete_dream_job el dictamen — ninguna de las dos se toca).
CREATE OR REPLACE FUNCTION public._priv_dreams_encrypt_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_txt text;
    v_ok  boolean;
    v_any boolean := false;
BEGIN
    IF NEW.dream_text IS NOT NULL AND NEW.dream_text <> '' THEN
        IF public._priv_is_armored(NEW.dream_text) THEN
            v_any := true;
        ELSE
            SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.dream_text);
            IF v_ok THEN NEW.dream_text := v_txt; v_any := true; END IF;
        END IF;
    END IF;

    IF NEW.dictamen_vibral IS NOT NULL AND NEW.dictamen_vibral <> '' THEN
        IF public._priv_is_armored(NEW.dictamen_vibral) THEN
            v_any := true;
        ELSE
            SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.dictamen_vibral);
            IF v_ok THEN NEW.dictamen_vibral := v_txt; v_any := true; END IF;
        END IF;
    END IF;

    IF NEW.calibracion_quirurgica IS NOT NULL AND NEW.calibracion_quirurgica <> '' THEN
        IF public._priv_is_armored(NEW.calibracion_quirurgica) THEN
            v_any := true;
        ELSE
            SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.calibracion_quirurgica);
            IF v_ok THEN NEW.calibracion_quirurgica := v_txt; v_any := true; END IF;
        END IF;
    END IF;

    IF NEW.custom_title IS NOT NULL AND NEW.custom_title <> '' THEN
        IF public._priv_is_armored(NEW.custom_title) THEN
            v_any := true;
        ELSE
            SELECT o_text, o_enc INTO v_txt, v_ok FROM public._priv_encrypt(NEW.custom_title);
            IF v_ok THEN NEW.custom_title := v_txt; v_any := true; END IF;
        END IF;
    END IF;

    IF v_any THEN NEW.enc := true; END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;  -- nunca rompe una decodificación en curso
END $$;

DROP TRIGGER IF EXISTS dream_records_encrypt ON public.dream_records;
CREATE TRIGGER dream_records_encrypt
    BEFORE INSERT OR UPDATE OF dream_text, dictamen_vibral,
                               calibracion_quirurgica, custom_title
    ON public.dream_records
    FOR EACH ROW EXECUTE FUNCTION public._priv_dreams_encrypt_tg();

COMMIT;

-- =============================================================================
-- 4) BACKFILL — AL FINAL, cuando las lectoras ya descifran.
--    Cada bloque va en su propia transacción: si uno falla, los anteriores
--    quedan hechos y se puede re-correr el archivo (es idempotente: el WHERE
--    salta lo ya cifrado y el trigger detecta el armor).
--    En volúmenes grandes esto puede tardar unos segundos; es normal.
-- =============================================================================

-- ── 4.1) BITÁCORA
DO $$
DECLARE k text; n int;
BEGIN
    k := public._priv_key();
    IF k IS NULL THEN
        RAISE NOTICE 'BACKFILL bitacora OMITIDO: el Vault no devolvió la llave.';
        RETURN;
    END IF;
    UPDATE public.bitacora_notas
       SET title = CASE WHEN title IS NOT NULL AND title <> ''
                          AND NOT public._priv_is_armored(title)
                        THEN armor(pgp_sym_encrypt(title, k)) ELSE title END,
           body  = CASE WHEN body IS NOT NULL AND body <> ''
                          AND NOT public._priv_is_armored(body)
                        THEN armor(pgp_sym_encrypt(body, k))  ELSE body END,
           enc   = true
     WHERE NOT COALESCE(enc, false);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'BACKFILL bitacora_notas: % filas cifradas.', n;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'BACKFILL bitacora FALLÓ (nada se perdió, re-corre el archivo): %', SQLERRM;
END $$;

-- ── 4.2) RACHAS
DO $$
DECLARE k text; n int;
BEGIN
    k := public._priv_key();
    IF k IS NULL THEN
        RAISE NOTICE 'BACKFILL rachas OMITIDO: el Vault no devolvió la llave.';
        RETURN;
    END IF;
    UPDATE public.rachas
       SET title = CASE WHEN title IS NOT NULL AND title <> ''
                          AND NOT public._priv_is_armored(title)
                        THEN armor(pgp_sym_encrypt(title, k)) ELSE title END,
           enc   = true
     WHERE NOT COALESCE(enc, false);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'BACKFILL rachas: % filas cifradas.', n;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'BACKFILL rachas FALLÓ (nada se perdió, re-corre el archivo): %', SQLERRM;
END $$;

-- ── 4.3) SUEÑOS
DO $$
DECLARE k text; n int;
BEGIN
    k := public._priv_key();
    IF k IS NULL THEN
        RAISE NOTICE 'BACKFILL dream_records OMITIDO: el Vault no devolvió la llave.';
        RETURN;
    END IF;
    UPDATE public.dream_records
       SET dream_text = CASE WHEN dream_text IS NOT NULL AND dream_text <> ''
                               AND NOT public._priv_is_armored(dream_text)
                             THEN armor(pgp_sym_encrypt(dream_text, k)) ELSE dream_text END,
           dictamen_vibral = CASE WHEN dictamen_vibral IS NOT NULL AND dictamen_vibral <> ''
                                    AND NOT public._priv_is_armored(dictamen_vibral)
                                  THEN armor(pgp_sym_encrypt(dictamen_vibral, k)) ELSE dictamen_vibral END,
           calibracion_quirurgica = CASE WHEN calibracion_quirurgica IS NOT NULL AND calibracion_quirurgica <> ''
                                           AND NOT public._priv_is_armored(calibracion_quirurgica)
                                         THEN armor(pgp_sym_encrypt(calibracion_quirurgica, k)) ELSE calibracion_quirurgica END,
           custom_title = CASE WHEN custom_title IS NOT NULL AND custom_title <> ''
                                 AND NOT public._priv_is_armored(custom_title)
                               THEN armor(pgp_sym_encrypt(custom_title, k)) ELSE custom_title END,
           enc = true
     WHERE NOT COALESCE(enc, false);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'BACKFILL dream_records: % filas cifradas.', n;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'BACKFILL dream_records FALLÓ (nada se perdió, re-corre el archivo): %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICAR (opcional, después de pegar). Lo primero debe dar todo `true`;
-- lo segundo debe devolver tu texto LEGIBLE (prueba de que el round-trip cierra).
-- =============================================================================
--   SELECT 'bitacora' t, count(*) FILTER (WHERE enc) cifradas, count(*) total FROM bitacora_notas
--   UNION ALL SELECT 'rachas', count(*) FILTER (WHERE enc), count(*) FROM rachas
--   UNION ALL SELECT 'suenos', count(*) FILTER (WHERE enc), count(*) FROM dream_records;
--
--   -- que se lea bien de vuelta (pon tu clerk_user_id):
--   SELECT public.get_my_notas('user_XXXX');
--   SELECT public.get_my_rachas('user_XXXX');
--   SELECT public.get_my_dream_records('user_XXXX', 3);
--
--   -- y que en disco esté ilegible:
--   SELECT left(title, 30) FROM rachas LIMIT 3;   -- debe verse '-----BEGIN PGP MESSAGE-----'
