-- 20260531c_vtli_update_narration.sql
-- EDICIÓN DE NARRACIÓN: permite editar a mano el guion de voz en off de un
-- storyboard ANTES de pasarlo por ElevenLabs. El panel (Estudio Manual)
-- guarda el texto editado vía este RPC; generar-narracion-voz lee la
-- narración fresca de la DB, así que la voz usa siempre el texto guardado.
-- Aplicar pegando este archivo COMPLETO en Supabase Dashboard → SQL Editor → Run.
-- (Asume 20260530 / b / c / 20260531 ya aplicadas.)

CREATE OR REPLACE FUNCTION public.update_vtli_draft_narration(
    p_admin_clerk_id text,
    p_draft_id uuid,
    p_narration text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_id uuid;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.vtli_drafts
    SET narration = p_narration
    WHERE id = p_draft_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'draft_not_found');
    END IF;

    RETURN json_build_object('success', true, 'draft_id', v_updated_id);
END $$;

GRANT EXECUTE ON FUNCTION public.update_vtli_draft_narration(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260531c_vtli_update_narration.sql
--
-- Validar tras aplicar:
--   SELECT update_vtli_draft_narration('TU_CLERK_ID', 'UUID_DRAFT', 'texto editado');
-- ============================================================
