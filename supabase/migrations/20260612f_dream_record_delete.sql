-- Red Solar Viva · Bóveda de Estasis — borrado de un sueño propio (swipe-to-delete)
-- =====================================================================================
-- Permite que el Tripulante borre un registro de su Bóveda. SECURITY DEFINER,
-- keyed por el clerk_user_id VERIFICADO (lo inyecta el gateway user-action) +
-- el id del registro → solo puede borrar SUS propios sueños (el WHERE exige que
-- el registro pertenezca al usuario verificado; un p_record_id ajeno no borra nada).
--
-- GRANT solo a service_role: lo llama exclusivamente el gateway user-action.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION delete_my_dream_record(
    target_clerk_id text,
    p_record_id     uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted int;
BEGIN
    IF target_clerk_id IS NULL OR length(target_clerk_id) < 3 OR p_record_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'bad_args');
    END IF;

    DELETE FROM dream_records
    WHERE id = p_record_id
      AND clerk_user_id = target_clerk_id;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN jsonb_build_object('ok', v_deleted > 0, 'deleted', v_deleted);
END;
$$;

REVOKE ALL ON FUNCTION delete_my_dream_record(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_my_dream_record(text, uuid) TO service_role;
