-- Red Solar Viva · Wallpapers (galería de fondos descargables)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Galería de Wallpapers full-res hosteados en Cloudflare R2. El Tripulante
-- ve la galería (get_wallpapers, RPC pública anon) y descarga vía el edge
-- existente descargar-media. Las filas se CREAN por el edge upload-wallpaper
-- (subida admin a R2 + INSERT). Aquí solo declaramos la tabla + las RPC de
-- lectura pública y de administración (CRUD de metadatos).
--
-- Seguridad: la tabla con RLS sin policies → solo accesible vía las RPCs
-- SECURITY DEFINER. La pública (get_wallpapers) va GRANT a anon+authenticated;
-- las admin_* van REVOKE anon + GRANT service_role (las llama el gateway
-- admin-action tras verificar el token; además re-validan is_admin con el id
-- admin inyectado verificado).

-- ── Tabla ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallpapers (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title      text NOT NULL DEFAULT 'Wallpaper',
    image_url  text,                              -- URL pública de R2 (full-res)
    is_free    boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    active     boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- RPC PÚBLICA  (el cliente la llama directo con la anon key)
-- ════════════════════════════════════════════════════════════════════

-- Wallpapers ACTIVE para la galería del Tripulante.
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
        'sort_order', sort_order
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM wallpapers
    WHERE active;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN  (ruteadas por admin-action; doble blindaje: gateway valida
-- is_admin + estas revalidan con el id admin verificado inyectado)
-- ════════════════════════════════════════════════════════════════════

-- Catálogo completo (incluye inactivos) para el editor del Motor.
CREATE OR REPLACE FUNCTION public.admin_get_wallpapers(p_admin_clerk_id text)
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
        'title', title,
        'image_url', image_url,
        'is_free', is_free,
        'sort_order', sort_order,
        'active', active,
        'created_at', created_at
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM wallpapers;

    RETURN result;
END;
$$;

-- Actualiza title/is_free/sort_order/active de la fila p_id.
-- (Las filas se CREAN por el edge upload-wallpaper, no por esta RPC.)
CREATE OR REPLACE FUNCTION public.admin_upsert_wallpaper(
    p_admin_clerk_id text,
    p_id             uuid,
    p_title          text,
    p_is_free        boolean,
    p_sort_order     integer,
    p_active         boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  wallpapers%ROWTYPE;
    tl text := LEFT(TRIM(COALESCE(p_title, '')), 200);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    UPDATE wallpapers
    SET title      = CASE WHEN LENGTH(tl) > 0 THEN tl ELSE title END,
        is_free    = COALESCE(p_is_free, is_free),
        sort_order = COALESCE(p_sort_order, sort_order),
        active     = COALESCE(p_active, active)
    WHERE id = p_id
    RETURNING * INTO r;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    RETURN json_build_object(
        'id', r.id,
        'title', r.title,
        'image_url', r.image_url,
        'is_free', r.is_free,
        'sort_order', r.sort_order,
        'active', r.active,
        'created_at', r.created_at
    );
END;
$$;

-- Borra la fila p_id.
CREATE OR REPLACE FUNCTION public.admin_delete_wallpaper(
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

    DELETE FROM wallpapers WHERE id = p_id;
    RETURN json_build_object('deleted', true);
END;
$$;

-- ── Permisos ────────────────────────────────────────────────────────
-- Pública: anon + authenticated (la llama el cliente con la anon key).
GRANT EXECUTE ON FUNCTION public.get_wallpapers()                                         TO anon, authenticated;

-- Admin: solo service_role (las llama el gateway admin-action).
REVOKE EXECUTE ON FUNCTION public.admin_get_wallpapers(text)                              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_wallpaper(text, uuid, text, boolean, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_wallpaper(text, uuid)                      FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_wallpapers(text)                               TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_wallpaper(text, uuid, text, boolean, integer, boolean)  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_wallpaper(text, uuid)                       TO service_role;
