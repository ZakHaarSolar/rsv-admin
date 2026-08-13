-- Red Solar Viva · DECODIFICADOR DE MATERIA — renombrar en la Bóveda
-- =====================================================================
-- 20260712e_matter_rename.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El Tripulante escanea los INGREDIENTES, pero recuerda el producto por su
-- NOMBRE comercial. Esta RPC deja renombrar un registro de la Bóveda: escribe
-- input_label (el título de la tarjeta + lo que filtra el buscador). Mismo
-- patrón seguro que rename_my_dream_record: keyed por target_clerk_id INYECTADO
-- por el gateway user-action (el cliente NO lo manda) → solo toca la fila propia.
-- Va por gateway (REVOKE anon; GRANT service_role), como el resto de la Bóveda
-- de Materia (get_my_matter_records / delete_my_matter_record).

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
    -- Vacío = vuelve al nombre automático (fallback en la UI).
    clean_label := NULLIF(LEFT(BTRIM(COALESCE(p_new_label, '')), 120), '');
    UPDATE public.matter_jobs
       SET input_label = clean_label
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

NOTIFY pgrst, 'reload schema';
