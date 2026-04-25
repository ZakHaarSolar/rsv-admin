-- ═══════════════════════════════════════════════════════════════════════
-- Perfiles de Nodo · flag es_host (identifica a Zak'Haar / anfitrión)
--
-- Al marcar un perfil como `es_host=true`, todos sus aliases se pintan
-- en dorado en la Trayectoria de Nodos, sin importar el nombre anclado.
-- Útil cuando Deepgram cambia el speaker_id de Zak'Haar entre sesiones
-- (a veces es speaker_0, a veces speaker_1, etc.) y queremos identificar
-- visualmente al anfitrión de un vistazo.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.perfiles_nodo
    ADD COLUMN IF NOT EXISTS es_host BOOLEAN NOT NULL DEFAULT FALSE;

-- Reescribir upsert para aceptar p_es_host opcional
CREATE OR REPLACE FUNCTION public.upsert_perfil_nodo_y_alias_admin(
    p_clerk_id  TEXT,
    p_id_sesion TEXT,
    p_speaker_id TEXT,
    p_nombre    TEXT DEFAULT NULL,
    p_eliminar  BOOLEAN DEFAULT FALSE,
    p_es_host   BOOLEAN DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin   BOOLEAN;
    v_perfil_id  UUID;
    v_nombre     TEXT := NULLIF(TRIM(COALESCE(p_nombre, '')), '');
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    IF p_id_sesion IS NULL OR p_speaker_id IS NULL THEN
        RETURN json_build_object('error','missing_params');
    END IF;

    -- Caso eliminar
    IF p_eliminar THEN
        INSERT INTO public.alias_nodos_sesion
            (id_sesion, speaker_id, eliminado, updated_at)
        VALUES (p_id_sesion, p_speaker_id, TRUE, NOW())
        ON CONFLICT (id_sesion, speaker_id) DO UPDATE SET
            eliminado = TRUE,
            updated_at = NOW();
        RETURN json_build_object('success', TRUE, 'eliminado', TRUE);
    END IF;

    IF v_nombre IS NOT NULL THEN
        INSERT INTO public.perfiles_nodo (nombre_ancla, es_host)
        VALUES (v_nombre, COALESCE(p_es_host, FALSE))
        ON CONFLICT (slug) DO UPDATE SET
            nombre_ancla = EXCLUDED.nombre_ancla,
            es_host      = COALESCE(p_es_host, public.perfiles_nodo.es_host),
            updated_at   = NOW()
        RETURNING id INTO v_perfil_id;
    ELSE
        v_perfil_id := NULL;
    END IF;

    INSERT INTO public.alias_nodos_sesion
        (id_sesion, speaker_id, perfil_nodo_id, eliminado, updated_at)
    VALUES (p_id_sesion, p_speaker_id, v_perfil_id, FALSE, NOW())
    ON CONFLICT (id_sesion, speaker_id) DO UPDATE SET
        perfil_nodo_id = EXCLUDED.perfil_nodo_id,
        eliminado = FALSE,
        updated_at = NOW();

    RETURN json_build_object(
        'success', TRUE,
        'perfil_nodo_id', v_perfil_id,
        'nombre', v_nombre,
        'es_host', COALESCE(p_es_host, FALSE)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_perfil_nodo_y_alias_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;

-- Drop la firma vieja (5 args) si quedó colgada
DROP FUNCTION IF EXISTS public.upsert_perfil_nodo_y_alias_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN);

-- Incluir es_host en el response del get_alias
CREATE OR REPLACE FUNCTION public.get_alias_nodos_sesion_admin(
    p_clerk_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN json_build_object(
        'aliases', COALESCE((
            SELECT json_agg(row_to_json(a))
            FROM (
                SELECT
                    al.id_sesion,
                    al.speaker_id,
                    al.perfil_nodo_id,
                    al.eliminado,
                    pn.nombre_ancla,
                    pn.slug,
                    pn.avatar_color,
                    pn.es_host
                FROM public.alias_nodos_sesion al
                LEFT JOIN public.perfiles_nodo pn ON pn.id = al.perfil_nodo_id
            ) a
        ), '[]'::json),
        'perfiles', COALESCE((
            SELECT json_agg(row_to_json(p) ORDER BY p.nombre_ancla)
            FROM (
                SELECT id, nombre_ancla, slug, notas_admin, avatar_color,
                       es_host, created_at, updated_at
                FROM public.perfiles_nodo
                ORDER BY nombre_ancla
            ) p
        ), '[]'::json)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_alias_nodos_sesion_admin(TEXT) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
