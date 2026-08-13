-- Red Solar Viva · BITÁCORA — quitar la etiqueta forzada por defecto
-- =====================================================================
-- 20260711c_bitacora_no_default_tag.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Cambio: las notas ya NO tienen etiquetas predefinidas (revelaciones/
-- proyectos/…). El Tripulante crea SUS PROPIAS carpetas; una nota puede
-- quedar SIN carpeta. Antes, upsert_nota forzaba 'revelaciones' cuando el
-- tag llegaba vacío → toda nota sin carpeta salía etiquetada. Ahora el tag
-- vacío se conserva vacío (= sin carpeta). Solo cambia esa línea; el resto
-- de upsert_nota (límite freemium, saneos) queda idéntico.

CREATE OR REPLACE FUNCTION public.upsert_nota(
    p_clerk_user_id text,
    p_id            uuid,
    p_title         text,
    p_body          text,
    p_tag           text,
    p_pinned        boolean DEFAULT false,
    p_favorite      boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_title  text := LEFT(COALESCE(p_title, ''), 200);
    v_body   text := LEFT(COALESCE(p_body, ''), 20000);
    -- Carpeta LIBRE elegida por el Tripulante; vacío = sin carpeta.
    v_tag    text := LEFT(COALESCE(TRIM(p_tag), ''), 40);
    v_count  int;
    v_member boolean;
    v_exists boolean := false;
    v_row    public.bitacora_notas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_id IS NOT NULL THEN
        SELECT true INTO v_exists
        FROM public.bitacora_notas
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    END IF;

    IF v_exists THEN
        UPDATE public.bitacora_notas SET
            title = v_title,
            body = v_body,
            tag = v_tag,
            pinned = COALESCE(p_pinned, false),
            favorite = COALESCE(p_favorite, false),
            updated_at = now()
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
        RETURN json_build_object('ok', true, 'nota', public._nota_to_json(v_row));
    END IF;

    SELECT count(*)::int INTO v_count
    FROM public.bitacora_notas WHERE clerk_user_id = p_clerk_user_id;

    v_member := public._is_active_member(p_clerk_user_id);

    IF NOT v_member AND v_count >= 5 THEN
        RETURN json_build_object('error', 'limit_free');
    END IF;
    IF v_count >= 1000 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    INSERT INTO public.bitacora_notas
        (clerk_user_id, title, body, tag, pinned, favorite)
    VALUES
        (p_clerk_user_id, v_title, v_body, v_tag,
         COALESCE(p_pinned, false), COALESCE(p_favorite, false))
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'nota', public._nota_to_json(v_row));
END $$;

-- Re-afirmar el candado (un CREATE OR REPLACE puede re-abrir a PUBLIC).
REVOKE ALL ON FUNCTION public.upsert_nota(text, uuid, text, text, text, boolean, boolean)   FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_nota(text, uuid, text, text, text, boolean, boolean)  TO service_role;

NOTIFY pgrst, 'reload schema';
