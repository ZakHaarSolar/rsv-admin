-- Red Solar Viva · DECODIFICADOR DE MATERIA — nombre automático desde la foto
-- =====================================================================
-- 20260721b_matter_autoname.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cuando el Tripulante toma la foto del FRENTE del producto, el ojo de Gemini
-- (en el edge upload-matter-photo) lee el nombre comercial y lo guarda como
-- título del registro — PERO solo si el Tripulante no lo nombró él mismo.
--
-- Para distinguir "nombre puesto por la persona" de "nombre automático" sin
-- adivinar, agregamos la marca `label_manual`:
--   • create_matter_job con nombre (escaneo por TEXTO) → manual = true.
--   • create_matter_job sin nombre (escaneo por FOTO) → manual = false.
--   • complete_matter_job rellena input_label del dictamen (ingrediente) →
--     deja manual en false (el default), o sea AUTO.
--   • rename_my_matter_record (lápiz de la Bóveda / resultado) → manual = true
--     si pone nombre; false si lo vacía (vuelve al automático).
--   • set_matter_name_from_photo (la foto) → escribe SOLO si manual = false
--     → nunca pisa un nombre que la persona escribió; sí reemplaza el
--     automático (ingrediente) por el nombre comercial del frente.

-- ── 1) Marca de "nombre puesto por la persona" ───────────────────────
ALTER TABLE matter_jobs
    ADD COLUMN IF NOT EXISTS label_manual BOOLEAN NOT NULL DEFAULT false;

-- Backfill conservador: TODO registro con nombre existente se protege (no
-- queremos que una foto pise nombres que ya están). Los nuevos se rastrean bien.
UPDATE matter_jobs
   SET label_manual = true
 WHERE input_label IS NOT NULL AND BTRIM(input_label) <> '';

-- ── 2) create_matter_job — marca manual si vino con nombre (escaneo por texto).
--     Misma firma → la edge que lo llama no cambia.
DROP FUNCTION IF EXISTS create_matter_job(TEXT, TEXT);
CREATE OR REPLACE FUNCTION create_matter_job(
    p_clerk_user_id TEXT,
    p_input_label TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id UUID;
    v_label TEXT;
BEGIN
    IF p_clerk_user_id IS NULL OR LENGTH(p_clerk_user_id) < 3 THEN
        RAISE EXCEPTION 'clerk_user_id required';
    END IF;
    v_label := NULLIF(BTRIM(COALESCE(p_input_label, '')), '');
    INSERT INTO matter_jobs (clerk_user_id, status, input_label, label_manual)
    VALUES (
        p_clerk_user_id,
        'processing',
        v_label,
        v_label IS NOT NULL  -- vino con nombre escrito → manual
    )
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION create_matter_job(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION create_matter_job(TEXT, TEXT) TO service_role;

-- ── 3) rename_my_matter_record — el lápiz marca manual (o lo libera al vaciar).
CREATE OR REPLACE FUNCTION public.rename_my_matter_record(
    target_clerk_id TEXT,
    p_record_id     UUID,
    p_new_label     TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_label TEXT;
    hit         INT;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;
    IF p_record_id IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'record_required');
    END IF;
    clean_label := NULLIF(LEFT(BTRIM(COALESCE(p_new_label, '')), 120), '');
    UPDATE public.matter_jobs
       SET input_label = clean_label,
           label_manual = (clean_label IS NOT NULL)
     WHERE id = p_record_id
       AND clerk_user_id = target_clerk_id;
    GET DIAGNOSTICS hit = ROW_COUNT;
    IF hit = 0 THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'input_label', clean_label);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rename_my_matter_record(TEXT, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.rename_my_matter_record(TEXT, UUID, TEXT)
    TO service_role;

-- ── 4) set_matter_name_from_photo — el nombre leído del FRENTE. Escribe SOLO
--     si NO es manual (protege lo que la persona escribió; reemplaza el
--     automático). service_role: la llama el edge upload-matter-photo tras la
--     visión, con el clerk_user_id YA verificado del token.
CREATE OR REPLACE FUNCTION public.set_matter_name_from_photo(
    p_clerk_user_id TEXT,
    p_record_id     UUID,
    p_name          TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_name TEXT;
    hit        INT;
BEGIN
    IF p_clerk_user_id IS NULL OR LENGTH(p_clerk_user_id) < 3
       OR p_record_id IS NULL THEN
        RETURN json_build_object('ok', false, 'applied', false);
    END IF;
    clean_name := NULLIF(LEFT(BTRIM(COALESCE(p_name, '')), 120), '');
    IF clean_name IS NULL THEN
        RETURN json_build_object('ok', true, 'applied', false);
    END IF;
    UPDATE public.matter_jobs
       SET input_label = clean_name
     WHERE id = p_record_id
       AND clerk_user_id = p_clerk_user_id
       AND label_manual = false;  -- nunca pisar un nombre manual
    GET DIAGNOSTICS hit = ROW_COUNT;
    RETURN json_build_object(
        'ok', true,
        'applied', hit > 0,
        'input_label', CASE WHEN hit > 0 THEN clean_name ELSE NULL END
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_matter_name_from_photo(TEXT, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_matter_name_from_photo(TEXT, UUID, TEXT)
    TO service_role;

NOTIFY pgrst, 'reload schema';
