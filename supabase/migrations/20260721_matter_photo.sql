-- Red Solar Viva · DECODIFICADOR DE MATERIA — foto del producto en la Bóveda
-- =====================================================================
-- 20260721_matter_photo.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El Tripulante escanea los INGREDIENTES (dorso del empaque), pero reconoce el
-- producto por su FRENTE. Ahora puede tomarle una foto al frente y queda ligada
-- a ese registro: en la Bóveda la miniatura aparece a la izquierda del nombre
-- (reemplaza el hexágono) para ubicarlo de un vistazo.
--
-- La foto ya reducida (canvas ≤1000px JPEG) la sube el edge upload-matter-photo
-- a Cloudflare R2 (Sig V4, ruta con uuid) y la URL se guarda acá con
-- set_my_matter_photo, por gateway user-action (id inyectado del token → solo
-- toca la fila propia). R2 no cobra egreso → mostrar miniaturas a 10K escala
-- ~centavos/mes. El bucket no es listable; la ruta lleva uuid.
--
--   • photo_url en matter_jobs (la tabla-galería).
--   • set_my_matter_photo → gateway user-action (REVOKE anon; GRANT service_role).
--   • get_my_matter_records / get_matter_job devuelven photo_url (para la Bóveda
--     y la revelación en vivo).

-- ── 1) Columna de la foto del producto ───────────────────────────────
ALTER TABLE matter_jobs
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ── 2) set_my_matter_photo — guarda (o limpia) la URL de la foto de un
--     registro propio. Keyed por target_clerk_id INYECTADO por el gateway
--     (el cliente NO lo manda). Vacío = quita la foto (vuelve al hexágono).
CREATE OR REPLACE FUNCTION public.set_my_matter_photo(
    target_clerk_id TEXT,
    p_record_id     UUID,
    p_photo_url     TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_url TEXT;
    hit       INT;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;
    IF p_record_id IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'record_required');
    END IF;
    -- Solo aceptamos una URL https (la que devolvió el edge de subida a R2) o
    -- vacío para limpiar. Cualquier otra cosa se ignora → NULL (limpia).
    clean_url := NULLIF(BTRIM(COALESCE(p_photo_url, '')), '');
    IF clean_url IS NOT NULL AND clean_url NOT LIKE 'https://%' THEN
        clean_url := NULL;
    END IF;
    clean_url := LEFT(clean_url, 600);
    UPDATE public.matter_jobs
       SET photo_url = clean_url
     WHERE id = p_record_id
       AND clerk_user_id = target_clerk_id;
    GET DIAGNOSTICS hit = ROW_COUNT;
    IF hit = 0 THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'photo_url', clean_url);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_my_matter_photo(TEXT, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_my_matter_photo(TEXT, UUID, TEXT)
    TO service_role;

-- ── 3) get_matter_job — ahora también devuelve photo_url (la revelación en
--     vivo puede sembrar la miniatura). Conserva el fix del conflicto `v_out`
--     (20260625b). Gate-only de siempre.
CREATE OR REPLACE FUNCTION get_matter_job(
    target_clerk_id TEXT,
    p_record_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_out json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3
       OR p_record_id IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT row_to_json(r) INTO v_out
    FROM (
        SELECT id, created_at, status, result, input_label, photo_url
        FROM matter_jobs
        WHERE id = p_record_id AND clerk_user_id = target_clerk_id
        LIMIT 1
    ) r;
    RETURN v_out;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_matter_job(TEXT, UUID) TO service_role;

-- ── 4) get_my_matter_records — la GALERÍA (solo 'done'); ahora incluye
--     photo_url para la miniatura de cada tarjeta. Conserva `v_out` +
--     el filtro de SEÑAL CORRUPTA.
CREATE OR REPLACE FUNCTION get_my_matter_records(
    target_clerk_id TEXT,
    p_limit INT DEFAULT 200
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_out json;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN '[]'::json;
    END IF;
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO v_out
    FROM (
        SELECT id, created_at, input_label, result, photo_url
        FROM matter_jobs
        WHERE clerk_user_id = target_clerk_id
          AND status = 'done'
          AND result IS NOT NULL
          AND COALESCE(result -> 'dictamen_hud' ->> 'estado', '') <> 'SEÑAL CORRUPTA'
        ORDER BY created_at DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 500))
    ) r;
    RETURN v_out;
END;
$$;
REVOKE EXECUTE ON FUNCTION get_my_matter_records(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_my_matter_records(TEXT, INT) TO service_role;

-- Recargar el esquema de PostgREST tras los cambios de firma/columna.
NOTIFY pgrst, 'reload schema';

-- Verificar (con TU clerk_user_id real):
--   SELECT public.get_my_matter_records('<clerk_id>', 20);
--   -- guarda una foto de prueba y confirma que vuelve:
--   SELECT public.set_my_matter_photo('<clerk_id>', '<record_uuid>', 'https://ejemplo/x.jpg');
