-- 20260601c_vtli_colectivos_admin.sql
-- FASE B del cargador de Colectivos: RPCs admin para gestionar la biblioteca
-- vtli_colectivos desde el panel del Estudio Manual + FIX del selector.
--
-- · get_vtli_colectivos        → REEMPLAZO con el FIX del selector (ver nota).
-- · get_vtli_colectivos_admin  → lista COMPLETA (activos + inactivos).
-- · upsert_vtli_colectivo      → crea (p_id NULL) o edita un colectivo.
-- · set_vtli_colectivo_active  → activa/desactiva.
-- · delete_vtli_colectivo      → borra el row (la imagen en R2 queda).
--
-- 🐞 FIX DEL SELECTOR (causa real, código 42703). En 20260601b la subconsulta
--   `sub` de get_vtli_colectivos NO seleccionaba `created_at`, pero el ORDER BY
--   pedía `sub.created_at` → "column sub.created_at does not exist". Con un id
--   no-admin el RPC cortaba antes (unauthorized) y el error no se veía; con un
--   admin pasaba el gate y explotaba en la consulta → el selector quedaba vacío
--   ("solo Automático"). Fix: agregar created_at a la subconsulta.
--
-- 🜂 CHEQUEO ADMIN ROBUSTO (bool_or) — mejora adicional, no era la causa. El
--   patrón `SELECT is_admin INTO ... WHERE clerk_user_id = X` toma UNA fila
--   arbitraria; si hay perfiles DUPLICADos (pasó: migración 20260428 de dedup)
--   podría tomar la NO-admin. `bool_or(COALESCE(is_admin,false))` alcanza con
--   que CUALQUIER fila sea admin. SQL puro, idéntico resultado con una sola fila.

-- ============================================================
-- SELECTOR (reemplazo) — solo activos, id+campos para el selector del panel.
-- Misma firma y shape que 20260601b; cambia SOLO el chequeo admin a bool_or.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vtli_colectivos(
    p_admin_clerk_id text,
    p_category text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(
        json_agg(row_to_json(sub) ORDER BY sub.sort_order, sub.created_at),
        '[]'::json
    )
    INTO v_result
    FROM (
        SELECT id, name, species_traits, individual_variation, image_r2_url,
               category, sort_order, created_at
        FROM public.vtli_colectivos
        WHERE active = true
          AND (p_category IS NULL OR category IS NULL OR category = p_category)
    ) sub;

    RETURN json_build_object('colectivos', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vtli_colectivos(text, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- LISTA COMPLETA (gestión) — activos e inactivos, todos los campos.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vtli_colectivos_admin(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(
        json_agg(row_to_json(sub) ORDER BY sub.sort_order, sub.created_at),
        '[]'::json
    )
    INTO v_result
    FROM (
        SELECT id, name, species_traits, individual_variation, image_r2_url,
               category, active, sort_order, created_at
        FROM public.vtli_colectivos
    ) sub;

    RETURN json_build_object('colectivos', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vtli_colectivos_admin(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- UPSERT — crear (p_id NULL) o editar un colectivo.
-- Devuelve { colectivo } con el row final, o { error } (ej. nombre repetido).
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_vtli_colectivo(
    p_admin_clerk_id text,
    p_id uuid,
    p_name text,
    p_species_traits text,
    p_individual_variation text,
    p_image_r2_url text,
    p_category text DEFAULT NULL,
    p_sort_order int DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_row public.vtli_colectivos%ROWTYPE;
    v_name text := btrim(COALESCE(p_name, ''));
    v_traits text := btrim(COALESCE(p_species_traits, ''));
    v_cat text := NULLIF(btrim(COALESCE(p_category, '')), '');
    v_sort int;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF v_name = '' THEN
        RETURN json_build_object('error', 'name_required');
    END IF;
    IF v_traits = '' THEN
        RETURN json_build_object('error', 'species_traits_required');
    END IF;

    BEGIN
        IF p_id IS NULL THEN
            -- INSERT: sort_order al final si no se pasó.
            SELECT COALESCE(p_sort_order, COALESCE(MAX(sort_order), 0) + 1)
            INTO v_sort
            FROM public.vtli_colectivos;

            INSERT INTO public.vtli_colectivos
                (name, species_traits, individual_variation, image_r2_url,
                 category, active, sort_order)
            VALUES
                (v_name, v_traits, NULLIF(btrim(COALESCE(p_individual_variation, '')), ''),
                 NULLIF(btrim(COALESCE(p_image_r2_url, '')), ''),
                 v_cat, true, v_sort)
            RETURNING * INTO v_row;
        ELSE
            -- UPDATE por id.
            UPDATE public.vtli_colectivos
            SET name = v_name,
                species_traits = v_traits,
                individual_variation = NULLIF(btrim(COALESCE(p_individual_variation, '')), ''),
                image_r2_url = NULLIF(btrim(COALESCE(p_image_r2_url, '')), ''),
                category = v_cat,
                sort_order = COALESCE(p_sort_order, sort_order)
            WHERE id = p_id
            RETURNING * INTO v_row;

            IF NOT FOUND THEN
                RETURN json_build_object('error', 'not_found');
            END IF;
        END IF;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN json_build_object('error', 'name_taken');
    END;

    RETURN json_build_object('colectivo', row_to_json(v_row));
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_vtli_colectivo(
    text, uuid, text, text, text, text, text, int
) TO anon, authenticated, service_role;

-- ============================================================
-- ACTIVAR / DESACTIVAR — saca o mete el colectivo del selector.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_vtli_colectivo_active(
    p_admin_clerk_id text,
    p_id uuid,
    p_active boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.vtli_colectivos
    SET active = COALESCE(p_active, true)
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_vtli_colectivo_active(text, uuid, boolean)
    TO anon, authenticated, service_role;

-- ============================================================
-- BORRAR — elimina el row. La imagen en R2 NO se borra acá.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_vtli_colectivo(
    p_admin_clerk_id text,
    p_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    DELETE FROM public.vtli_colectivos WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_colectivo(text, uuid)
    TO anon, authenticated, service_role;

-- Verificación:
--   SELECT name, active, sort_order, (image_r2_url IS NOT NULL) AS has_img
--   FROM public.vtli_colectivos ORDER BY sort_order;
