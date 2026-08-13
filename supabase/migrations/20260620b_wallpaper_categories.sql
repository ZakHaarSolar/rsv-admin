-- Red Solar Viva · Wallpapers · Categorías (clasificación de la galería)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Contrato ADITIVO sobre el feature base (20260620_wallpapers.sql). Suma una
-- tabla de categorías + un FK opcional en wallpapers, para que el Tripulante
-- filtre la galería por categoría (Familia Cósmica, Hadas, Elementales, etc.).
--
-- Lectura pública: get_wallpapers() ahora devuelve category_id por wallpaper;
-- get_wallpaper_categories() lista las categorías ACTIVE (ambas anon).
-- Administración: CRUD de categorías + asignación de categoría a un wallpaper,
-- todo SECURITY DEFINER, REVOKE anon + GRANT service_role, ruteado por el
-- gateway admin-action (que inyecta el id admin verificado del token).

-- ── Tabla ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallpaper_categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    active     boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallpaper_categories ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ── FK opcional en wallpapers ───────────────────────────────────────
-- Al borrar la categoría, los wallpapers quedan category_id NULL (sin categoría).
ALTER TABLE public.wallpapers
    ADD COLUMN IF NOT EXISTS category_id uuid
    REFERENCES public.wallpaper_categories(id) ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════════════════
-- RPCs PÚBLICAS  (el cliente las llama directo con la anon key)
-- ════════════════════════════════════════════════════════════════════

-- Wallpapers ACTIVE para la galería del Tripulante (AHORA con category_id).
CREATE OR REPLACE FUNCTION public.get_wallpapers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'image_url', image_url,
        'is_free', is_free,
        'sort_order', sort_order,
        'category_id', category_id
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM wallpapers
    WHERE active;

    RETURN result;
END;
$$;

-- Categorías ACTIVE para el filtro de la galería.
CREATE OR REPLACE FUNCTION public.get_wallpaper_categories()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'name', name,
        'sort_order', sort_order
    ) ORDER BY sort_order, name), '[]'::json)
    INTO result
    FROM wallpaper_categories
    WHERE active;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN  (ruteadas por admin-action; doble blindaje: gateway valida
-- is_admin + estas revalidan con el id admin verificado inyectado)
-- ════════════════════════════════════════════════════════════════════

-- Catálogo completo de categorías (incluye inactivas) para el editor del Motor.
CREATE OR REPLACE FUNCTION public.admin_get_wallpaper_categories(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'name', name,
        'sort_order', sort_order,
        'active', active
    ) ORDER BY sort_order, name), '[]'::json)
    INTO result
    FROM wallpaper_categories;

    RETURN result;
END;
$$;

-- Crea (p_id NULL) o actualiza (p_id no NULL) una categoría.
CREATE OR REPLACE FUNCTION public.admin_upsert_wallpaper_category(
    p_admin_clerk_id text,
    p_id             uuid,
    p_name           text,
    p_sort_order     integer,
    p_active         boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  wallpaper_categories%ROWTYPE;
    nm text := LEFT(TRIM(COALESCE(p_name, '')), 120);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO wallpaper_categories (name, sort_order, active)
        VALUES (
            CASE WHEN LENGTH(nm) > 0 THEN nm ELSE 'Categoría' END,
            COALESCE(p_sort_order, 0),
            COALESCE(p_active, true)
        )
        RETURNING * INTO r;
    ELSE
        UPDATE wallpaper_categories
        SET name       = CASE WHEN LENGTH(nm) > 0 THEN nm ELSE name END,
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id
        RETURNING * INTO r;

        IF NOT FOUND THEN
            RETURN json_build_object('error', 'not_found');
        END IF;
    END IF;

    RETURN json_build_object(
        'id', r.id,
        'name', r.name,
        'sort_order', r.sort_order,
        'active', r.active
    );
END;
$$;

-- Borra la categoría p_id. Las wallpapers quedan category_id NULL por el FK.
CREATE OR REPLACE FUNCTION public.admin_delete_wallpaper_category(
    p_admin_clerk_id text,
    p_id             uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    DELETE FROM wallpaper_categories WHERE id = p_id;
    RETURN json_build_object('deleted', true);
END;
$$;

-- Asigna (o quita, p_category_id NULL) la categoría de un wallpaper.
CREATE OR REPLACE FUNCTION public.admin_set_wallpaper_category(
    p_admin_clerk_id text,
    p_id             uuid,
    p_category_id    uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    UPDATE wallpapers SET category_id = p_category_id WHERE id = p_id;
    RETURN json_build_object('ok', true);
END;
$$;

-- ── Seed idempotente (6 categorías base, sort_order 1..6) ────────────
INSERT INTO public.wallpaper_categories (name, sort_order, active)
SELECT v.name, v.sort_order, true
FROM (VALUES
    ('Familia Cósmica',    1),
    ('Hadas',              2),
    ('Elementales',        3),
    ('Maestros Ascendidos', 4),
    ('Geometría Sagrada',  5),
    ('Sueños Lúcidos',     6)
) AS v(name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM public.wallpaper_categories c WHERE c.name = v.name
);

-- ── Permisos ────────────────────────────────────────────────────────
-- Pública: anon + authenticated (las llama el cliente con la anon key).
GRANT EXECUTE ON FUNCTION public.get_wallpapers()                                         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallpaper_categories()                               TO anon, authenticated;

-- Admin: solo service_role (las llama el gateway admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_wallpaper_categories(text)                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_wallpaper_category(text, uuid, text, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_wallpaper_category(text, uuid)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_wallpaper_category(text, uuid, uuid)           FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_wallpaper_categories(text)                      TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_wallpaper_category(text, uuid, text, integer, boolean)  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_wallpaper_category(text, uuid)               TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_wallpaper_category(text, uuid, uuid)            TO service_role;
