-- Red Solar Viva · Ritual Diario · Catálogo de actividades (editor del Motor)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Contrato ADITIVO sobre el feature base (20260618b_ritual_diario.sql). El
-- catálogo de rituales (daily_ritual_catalog) ya existe; esto SOLO suma el CRUD
-- admin para editarlo desde el Motor de Intervención → pestaña "Rituales":
-- cambiar el label, los Fotones (points), si pide texto, si está activo y el
-- orden — y agregar rituales nuevos (ej. 'Estiramiento').
--
-- IMPORTANTE: cambiar points acá cambia los Fotones que otorga el server al
-- instante, SIN build (el cliente lee el catálogo vía get_ritual_diario y el
-- puntaje es server-authoritative en toggle_ritual). Un ritual NUEVO aparece en
-- la app sin build — la app renderiza activity_keys desconocidos con un ícono
-- por default.
--
-- NO se seedean actividades nuevas: Zak agrega 'Estiramiento' (y demás) desde el
-- panel. Las 3 RPC son SECURITY DEFINER, REVOKE anon + GRANT service_role,
-- ruteadas por el gateway admin-action (que inyecta el id admin verificado del
-- token y revalida is_admin); doble blindaje con el gate is_admin de cada RPC.

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN  (ruteadas por admin-action; doble blindaje: gateway valida
-- is_admin + estas revalidan con el id admin verificado inyectado)
-- ════════════════════════════════════════════════════════════════════

-- Catálogo completo (incluye INACTIVOS) para el editor del Motor.
CREATE OR REPLACE FUNCTION public.admin_get_ritual_catalog(p_admin_clerk_id text)
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
        'activity_key', activity_key,
        'label', label,
        'points', points,
        'requires_text', requires_text,
        'active', active,
        'sort_order', sort_order
    ) ORDER BY sort_order, label), '[]'::json)
    INTO result
    FROM daily_ritual_catalog;

    RETURN result;
END;
$$;

-- Crea o actualiza una actividad (upsert por activity_key, que es la PK).
CREATE OR REPLACE FUNCTION public.admin_upsert_ritual_activity(
    p_admin_clerk_id text,
    p_activity_key   text,
    p_label          text,
    p_points         integer,
    p_requires_text  boolean,
    p_active         boolean,
    p_sort_order     integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  daily_ritual_catalog%ROWTYPE;
    k  text := LEFT(TRIM(COALESCE(p_activity_key, '')), 80);
    nm text := LEFT(TRIM(COALESCE(p_label, '')), 120);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF LENGTH(k) = 0 THEN
        RETURN json_build_object('error', 'empty_key');
    END IF;

    INSERT INTO daily_ritual_catalog (activity_key, label, points, requires_text, active, sort_order)
    VALUES (
        k,
        CASE WHEN LENGTH(nm) > 0 THEN nm ELSE k END,
        COALESCE(p_points, 10),
        COALESCE(p_requires_text, false),
        COALESCE(p_active, true),
        COALESCE(p_sort_order, 0)
    )
    ON CONFLICT (activity_key) DO UPDATE
    SET label         = CASE WHEN LENGTH(nm) > 0 THEN nm ELSE daily_ritual_catalog.label END,
        points        = COALESCE(p_points, daily_ritual_catalog.points),
        requires_text = COALESCE(p_requires_text, daily_ritual_catalog.requires_text),
        active        = COALESCE(p_active, daily_ritual_catalog.active),
        sort_order    = COALESCE(p_sort_order, daily_ritual_catalog.sort_order)
    RETURNING * INTO r;

    RETURN json_build_object(
        'activity_key', r.activity_key,
        'label', r.label,
        'points', r.points,
        'requires_text', r.requires_text,
        'active', r.active,
        'sort_order', r.sort_order
    );
END;
$$;

-- Borra una actividad del catálogo. Los daily_checkins históricos se conservan
-- (no hay FK desde daily_checkins al catálogo → la historia de Fotones queda
-- intacta aunque el ritual ya no exista).
CREATE OR REPLACE FUNCTION public.admin_delete_ritual_activity(
    p_admin_clerk_id text,
    p_activity_key   text
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

    DELETE FROM daily_ritual_catalog WHERE activity_key = p_activity_key;
    RETURN json_build_object('deleted', true);
END;
$$;

-- ── Permisos: solo service_role (las llama el gateway admin-action) ──
REVOKE EXECUTE ON FUNCTION public.admin_get_ritual_catalog(text)                                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ritual_activity(text, text, text, integer, boolean, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_ritual_activity(text, text)                              FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_ritual_catalog(text)                                         TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_ritual_activity(text, text, text, integer, boolean, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_ritual_activity(text, text)                               TO service_role;
