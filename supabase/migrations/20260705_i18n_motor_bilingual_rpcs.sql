-- 20260705_i18n_motor_bilingual_rpcs.sql
-- FASE 3 i18n — INTERRUPTOR Español/English del Motor de Intervención.
-- =====================================================================
-- Habilita AUTORAR contenido bilingüe desde la UI del Motor. Cada editor gana un
-- toggle ES | EN; en EN los campos de texto escriben la columna _en, en ES la
-- columna base. Este archivo hace que el backend acepte eso:
--
--   • 7 LECTURAS admin devuelven ADEMÁS las columnas _en (para que el editor
--     muestre la traducción actual al togglear EN).
--   • 9 UPSERTS aceptan los params _en + p_lang y aplican un SET CONDICIONAL:
--       - p_lang='en'  → escribe SOLO las columnas de TEXTO _en.
--       - p_lang='es'  → escribe SOLO las columnas de TEXTO base.
--       - metadata (orden/activo/umbral/puntos/score/fase/paso) SIEMPRE se
--         actualiza (es agnóstica de idioma) → togglear activo/orden funciona en
--         cualquier modo sin pisar el otro idioma.
--
-- JSONB doble-codificado: options_json / tareas_json guardan un STRING JSON
-- (to_jsonb(<texto>)); el cliente manda JSON.stringify(...) → se guarda con
-- to_jsonb(p_...). El respaldo por idioma lo hacen las lecturas de la app
-- (COALESCE(x_en,x) / options_json_en ?? options_json), no estas RPCs.
--
-- Requiere las columnas _en de 20260704_i18n_content_en_columns.sql (ya aplicada).
--
-- Seguridad: las admin_* siguen REVOKE anon + GRANT service_role (van por el
-- gateway admin-action, que reenvía TODOS los params y solo inyecta el id admin
-- verificado). Se RE-AFIRMA el REVOKE tras cada CREATE (un CREATE puede reabrir
-- anon). Las 4 RPC del editor de Sondas/Calibraciones (get_all_sondas,
-- get_all_protocolos_admin, upsert_sonda, upsert_protocolo_admin) las llama el
-- cliente DIRECTO con la anon key (rpc()); mantienen GRANT anon (estado previo,
-- las usa SOLO el Motor — no la app). Se DROP por nombre (firma única) para no
-- adivinar tipos y evitar overloads.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- SECCIÓN A — UPSERTS ruteados por el gateway admin-action (7)
-- ════════════════════════════════════════════════════════════════════

-- ── A1. Categoría de afirmaciones ── nombre → nombre_en ──────────────
DROP FUNCTION IF EXISTS public.admin_upsert_ritual_categoria;
CREATE FUNCTION public.admin_upsert_ritual_categoria(
    p_admin_clerk_id text,
    p_id             uuid,
    p_nombre         text,
    p_sort_order     integer DEFAULT 0,
    p_active         boolean DEFAULT true,
    p_nombre_en      text    DEFAULT NULL,
    p_lang           text    DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r     ritual_afirmacion_categorias%ROWTYPE;
    nm    text := LEFT(TRIM(COALESCE(p_nombre, '')), 120);
    nm_en text := LEFT(TRIM(COALESCE(p_nombre_en, '')), 120);
    v_en  boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF NOT v_en AND LENGTH(nm) = 0 THEN
        RETURN json_build_object('error', 'empty');
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO ritual_afirmacion_categorias (nombre, nombre_en, sort_order, active)
        VALUES (nm, NULLIF(nm_en, ''), COALESCE(p_sort_order, 0), COALESCE(p_active, true))
        RETURNING * INTO r;
    ELSIF v_en THEN
        UPDATE ritual_afirmacion_categorias
        SET nombre_en  = NULLIF(nm_en, ''),
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    ELSE
        UPDATE ritual_afirmacion_categorias
        SET nombre     = nm,
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    END IF;

    RETURN json_build_object('id', r.id, 'nombre', r.nombre, 'nombre_en', r.nombre_en,
                             'sort_order', r.sort_order, 'active', r.active);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ritual_categoria(text, uuid, text, integer, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_ritual_categoria(text, uuid, text, integer, boolean, text, text) TO service_role;

-- ── A2. Afirmación ── texto → texto_en ──────────────────────────────
DROP FUNCTION IF EXISTS public.admin_upsert_ritual_afirmacion;
CREATE FUNCTION public.admin_upsert_ritual_afirmacion(
    p_admin_clerk_id text,
    p_id             uuid,
    p_categoria_id   uuid,
    p_texto          text,
    p_sort_order     integer DEFAULT 0,
    p_active         boolean DEFAULT true,
    p_texto_en       text    DEFAULT NULL,
    p_lang           text    DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r     ritual_afirmaciones%ROWTYPE;
    tx    text := LEFT(TRIM(COALESCE(p_texto, '')), 600);
    tx_en text := LEFT(TRIM(COALESCE(p_texto_en, '')), 600);
    v_en  boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF NOT v_en AND LENGTH(tx) = 0 THEN
        RETURN json_build_object('error', 'empty');
    END IF;

    IF p_id IS NULL THEN
        IF NOT EXISTS (SELECT 1 FROM ritual_afirmacion_categorias WHERE id = p_categoria_id) THEN
            RETURN json_build_object('error', 'bad_category');
        END IF;
        INSERT INTO ritual_afirmaciones (categoria_id, texto, texto_en, sort_order, active)
        VALUES (p_categoria_id, tx, NULLIF(tx_en, ''), COALESCE(p_sort_order, 0), COALESCE(p_active, true))
        RETURNING * INTO r;
    ELSIF v_en THEN
        UPDATE ritual_afirmaciones
        SET texto_en     = NULLIF(tx_en, ''),
            categoria_id = COALESCE(p_categoria_id, categoria_id),
            sort_order   = COALESCE(p_sort_order, sort_order),
            active       = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    ELSE
        UPDATE ritual_afirmaciones
        SET texto        = tx,
            categoria_id = COALESCE(p_categoria_id, categoria_id),
            sort_order   = COALESCE(p_sort_order, sort_order),
            active       = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    END IF;

    RETURN json_build_object('id', r.id, 'categoria_id', r.categoria_id, 'texto', r.texto,
                             'texto_en', r.texto_en, 'sort_order', r.sort_order, 'active', r.active);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ritual_afirmacion(text, uuid, uuid, text, integer, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_ritual_afirmacion(text, uuid, uuid, text, integer, boolean, text, text) TO service_role;

-- ── A3. Ritual (catálogo diario) ── label → label_en (upsert por activity_key) ─
DROP FUNCTION IF EXISTS public.admin_upsert_ritual_activity;
CREATE FUNCTION public.admin_upsert_ritual_activity(
    p_admin_clerk_id text,
    p_activity_key   text,
    p_label          text,
    p_points         integer,
    p_requires_text  boolean,
    p_active         boolean,
    p_sort_order     integer,
    p_label_en       text DEFAULT NULL,
    p_lang           text DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r     daily_ritual_catalog%ROWTYPE;
    k     text := LEFT(TRIM(COALESCE(p_activity_key, '')), 80);
    nm    text := LEFT(TRIM(COALESCE(p_label, '')), 120);
    nm_en text := LEFT(TRIM(COALESCE(p_label_en, '')), 120);
    v_en  boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF LENGTH(k) = 0 THEN
        RETURN json_build_object('error', 'empty_key');
    END IF;

    INSERT INTO daily_ritual_catalog (activity_key, label, label_en, points, requires_text, active, sort_order)
    VALUES (
        k,
        CASE WHEN LENGTH(nm) > 0 THEN nm ELSE k END,
        NULLIF(nm_en, ''),
        COALESCE(p_points, 10),
        COALESCE(p_requires_text, false),
        COALESCE(p_active, true),
        COALESCE(p_sort_order, 0)
    )
    ON CONFLICT (activity_key) DO UPDATE
    SET label         = CASE WHEN v_en THEN daily_ritual_catalog.label
                             WHEN LENGTH(nm) > 0 THEN nm
                             ELSE daily_ritual_catalog.label END,
        label_en      = CASE WHEN v_en THEN NULLIF(nm_en, '') ELSE daily_ritual_catalog.label_en END,
        points        = COALESCE(p_points, daily_ritual_catalog.points),
        requires_text = COALESCE(p_requires_text, daily_ritual_catalog.requires_text),
        active        = COALESCE(p_active, daily_ritual_catalog.active),
        sort_order    = COALESCE(p_sort_order, daily_ritual_catalog.sort_order)
    RETURNING * INTO r;

    RETURN json_build_object('activity_key', r.activity_key, 'label', r.label, 'label_en', r.label_en,
                             'points', r.points, 'requires_text', r.requires_text,
                             'active', r.active, 'sort_order', r.sort_order);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ritual_activity(text, text, text, integer, boolean, boolean, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_ritual_activity(text, text, text, integer, boolean, boolean, integer, text, text) TO service_role;

-- ── A4. Wallpaper ── title → title_en (solo UPDATE; las filas las crea el edge) ─
DROP FUNCTION IF EXISTS public.admin_upsert_wallpaper;
CREATE FUNCTION public.admin_upsert_wallpaper(
    p_admin_clerk_id text,
    p_id             uuid,
    p_title          text,
    p_is_free        boolean,
    p_sort_order     integer,
    p_active         boolean,
    p_title_en       text DEFAULT NULL,
    p_lang           text DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r     wallpapers%ROWTYPE;
    tl    text := LEFT(TRIM(COALESCE(p_title, '')), 200);
    tl_en text := LEFT(TRIM(COALESCE(p_title_en, '')), 200);
    v_en  boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    IF v_en THEN
        UPDATE wallpapers
        SET title_en   = NULLIF(tl_en, ''),
            is_free    = COALESCE(p_is_free, is_free),
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
    ELSE
        UPDATE wallpapers
        SET title      = CASE WHEN LENGTH(tl) > 0 THEN tl ELSE title END,
            is_free    = COALESCE(p_is_free, is_free),
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
    END IF;

    IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;

    RETURN json_build_object('id', r.id, 'title', r.title, 'title_en', r.title_en, 'image_url', r.image_url,
                             'is_free', r.is_free, 'sort_order', r.sort_order, 'active', r.active, 'created_at', r.created_at);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_wallpaper(text, uuid, text, boolean, integer, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_wallpaper(text, uuid, text, boolean, integer, boolean, text, text) TO service_role;

-- ── A5. Categoría de wallpapers ── name → name_en ───────────────────
DROP FUNCTION IF EXISTS public.admin_upsert_wallpaper_category;
CREATE FUNCTION public.admin_upsert_wallpaper_category(
    p_admin_clerk_id text,
    p_id             uuid,
    p_name           text,
    p_sort_order     integer,
    p_active         boolean,
    p_name_en        text DEFAULT NULL,
    p_lang           text DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r     wallpaper_categories%ROWTYPE;
    nm    text := LEFT(TRIM(COALESCE(p_name, '')), 120);
    nm_en text := LEFT(TRIM(COALESCE(p_name_en, '')), 120);
    v_en  boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO wallpaper_categories (name, name_en, sort_order, active)
        VALUES (
            CASE WHEN LENGTH(nm) > 0 THEN nm ELSE 'Categoría' END,
            NULLIF(nm_en, ''),
            COALESCE(p_sort_order, 0),
            COALESCE(p_active, true)
        )
        RETURNING * INTO r;
    ELSIF v_en THEN
        UPDATE wallpaper_categories
        SET name_en    = NULLIF(nm_en, ''),
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    ELSE
        UPDATE wallpaper_categories
        SET name       = CASE WHEN LENGTH(nm) > 0 THEN nm ELSE name END,
            sort_order = COALESCE(p_sort_order, sort_order),
            active     = COALESCE(p_active, active)
        WHERE id = p_id RETURNING * INTO r;
        IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;
    END IF;

    RETURN json_build_object('id', r.id, 'name', r.name, 'name_en', r.name_en,
                             'sort_order', r.sort_order, 'active', r.active);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_wallpaper_category(text, uuid, text, integer, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_wallpaper_category(text, uuid, text, integer, boolean, text, text) TO service_role;

-- ── A6. Tier de medalla ── label → label_en (upsert por constelacion_key+tier_index) ─
DROP FUNCTION IF EXISTS public.admin_upsert_medal_tier;
CREATE FUNCTION public.admin_upsert_medal_tier(
    p_admin_clerk_id   text,
    p_constelacion_key text,
    p_tier_index       int,
    p_label            text,
    p_threshold        numeric,
    p_label_en         text DEFAULT NULL,
    p_lang             text DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_en boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM medal_constelaciones WHERE constelacion_key = p_constelacion_key) THEN
        RETURN json_build_object('error', 'no_constelacion');
    END IF;

    INSERT INTO medal_tiers (constelacion_key, tier_index, label, label_en, threshold, sort_order)
    VALUES (
        p_constelacion_key, p_tier_index,
        LEFT(TRIM(COALESCE(p_label, '')), 40),
        NULLIF(LEFT(TRIM(COALESCE(p_label_en, '')), 40), ''),
        GREATEST(COALESCE(p_threshold, 0), 0), p_tier_index
    )
    ON CONFLICT (constelacion_key, tier_index) DO UPDATE
    SET label     = CASE WHEN v_en THEN medal_tiers.label ELSE EXCLUDED.label END,
        label_en  = CASE WHEN v_en THEN EXCLUDED.label_en ELSE medal_tiers.label_en END,
        threshold = EXCLUDED.threshold;

    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_medal_tier(text, text, int, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_medal_tier(text, text, int, text, numeric, text, text) TO service_role;

-- ── A7. Meta de constelación ── label/subtitle → label_en/subtitle_en ─
DROP FUNCTION IF EXISTS public.admin_set_medal_constelacion;
CREATE FUNCTION public.admin_set_medal_constelacion(
    p_admin_clerk_id   text,
    p_constelacion_key text,
    p_label            text,
    p_subtitle         text,
    p_active           boolean,
    p_label_en         text DEFAULT NULL,
    p_subtitle_en      text DEFAULT NULL,
    p_lang             text DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_en boolean := (p_lang = 'en');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    IF v_en THEN
        UPDATE medal_constelaciones
        SET label_en    = NULLIF(LEFT(TRIM(COALESCE(p_label_en, '')), 40), ''),
            subtitle_en = NULLIF(LEFT(TRIM(COALESCE(p_subtitle_en, '')), 60), ''),
            active      = COALESCE(p_active, active),
            updated_at  = now()
        WHERE constelacion_key = p_constelacion_key;
    ELSE
        UPDATE medal_constelaciones
        SET label      = LEFT(TRIM(COALESCE(p_label, label)), 40),
            subtitle   = LEFT(TRIM(COALESCE(p_subtitle, subtitle)), 60),
            active     = COALESCE(p_active, active),
            updated_at = now()
        WHERE constelacion_key = p_constelacion_key;
    END IF;

    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_medal_constelacion(text, text, text, text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_medal_constelacion(text, text, text, text, boolean, text, text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- SECCIÓN B — LECTURAS admin: devuelven ADEMÁS las columnas _en
--   (CREATE OR REPLACE — misma firma; se RE-AFIRMA el REVOKE/GRANT)
-- ════════════════════════════════════════════════════════════════════

-- ── B1. Afirmaciones (categorías + afirmaciones) ────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_ritual_afirmaciones(p_admin_clerk_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(json_agg(json_build_object(
        'id', c.id,
        'nombre', c.nombre,
        'nombre_en', c.nombre_en,
        'sort_order', c.sort_order,
        'active', c.active,
        'afirmaciones', COALESCE((
            SELECT json_agg(json_build_object(
                'id', a.id, 'texto', a.texto, 'texto_en', a.texto_en,
                'sort_order', a.sort_order, 'active', a.active
            ) ORDER BY a.sort_order, a.created_at)
            FROM ritual_afirmaciones a WHERE a.categoria_id = c.id
        ), '[]'::json)
    ) ORDER BY c.sort_order, c.created_at), '[]'::json)
    INTO result
    FROM ritual_afirmacion_categorias c;

    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_ritual_afirmaciones(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_ritual_afirmaciones(text) TO service_role;

-- ── B2. Catálogo de rituales diarios ── label_en ────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_ritual_catalog(p_admin_clerk_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(json_agg(json_build_object(
        'activity_key', activity_key,
        'label', label,
        'label_en', label_en,
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
REVOKE EXECUTE ON FUNCTION public.admin_get_ritual_catalog(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_ritual_catalog(text) TO service_role;

-- ── B3. Wallpapers ── title_en ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_wallpapers(p_admin_clerk_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'title_en', title_en,
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
REVOKE EXECUTE ON FUNCTION public.admin_get_wallpapers(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_wallpapers(text) TO service_role;

-- ── B4. Categorías de wallpapers ── name_en ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_wallpaper_categories(p_admin_clerk_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'name', name,
        'name_en', name_en,
        'sort_order', sort_order,
        'active', active
    ) ORDER BY sort_order, name), '[]'::json)
    INTO result
    FROM wallpaper_categories;

    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_wallpaper_categories(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_wallpaper_categories(text) TO service_role;

-- ── B5. Medallas (constelaciones + tiers) ── label_en/subtitle_en/label_en ─
CREATE OR REPLACE FUNCTION public.admin_get_medallas(p_admin_clerk_id text)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    SELECT COALESCE(json_agg(json_build_object(
        'key', mc.constelacion_key,
        'label', mc.label,
        'label_en', mc.label_en,
        'subtitle', mc.subtitle,
        'subtitle_en', mc.subtitle_en,
        'glyph', mc.glyph_key,
        'metric', mc.metric,
        'accent', mc.accent,
        'active', mc.active,
        'sort_order', mc.sort_order,
        'tiers', COALESCE((
            SELECT json_agg(json_build_object(
                'tier_index', mt.tier_index, 'label', mt.label, 'label_en', mt.label_en, 'threshold', mt.threshold
            ) ORDER BY mt.tier_index)
            FROM medal_tiers mt WHERE mt.constelacion_key = mc.constelacion_key
        ), '[]'::json)
    ) ORDER BY mc.sort_order, mc.label), '[]'::json)
    INTO result FROM medal_constelaciones mc;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_medallas(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_medallas(text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- SECCIÓN C — Editor de Sondas/Calibraciones (llamado DIRECTO con la anon
--   key vía rpc(); SOLO lo usa el Motor, no la app). Se reconstruye por
--   DROP por nombre (firma única) + CREATE. GRANT anon se preserva.
-- ════════════════════════════════════════════════════════════════════

-- ── C1. Lectura de TODAS las sondas (incluye _en) ───────────────────
DROP FUNCTION IF EXISTS public.get_all_sondas;
CREATE FUNCTION public.get_all_sondas()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'pilar', pilar,
        'step_order', step_order,
        'question_text', question_text,
        'question_text_en', question_text_en,
        'options_json', options_json,
        'options_json_en', options_json_en,
        'is_active', is_active
    ) ORDER BY pilar, step_order), '[]'::json)
    FROM public.sondas_config;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_sondas() TO anon, authenticated, service_role;

-- ── C2. Upsert de sonda ── question_text/options_json (+ _en), SET condicional ─
--   options_json guarda un STRING JSON doble-codificado (to_jsonb(<texto>)),
--   idéntico al patrón vivo; el cliente manda JSON.stringify(opciones).
DROP FUNCTION IF EXISTS public.upsert_sonda;
CREATE FUNCTION public.upsert_sonda(
    p_id               uuid    DEFAULT NULL,
    p_pilar            text    DEFAULT NULL,
    p_step_order       int     DEFAULT NULL,
    p_question_text    text    DEFAULT NULL,
    p_options_json     text    DEFAULT NULL,
    p_is_active        boolean DEFAULT true,
    p_question_text_en text    DEFAULT NULL,
    p_options_json_en  text    DEFAULT NULL,
    p_lang             text    DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r    sondas_config%ROWTYPE;
    v_en boolean := (p_lang = 'en');
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO sondas_config (pilar, step_order, question_text, options_json,
                                   question_text_en, options_json_en, is_active)
        VALUES (
            p_pilar,
            COALESCE(p_step_order, 1),
            COALESCE(p_question_text, ''),
            to_jsonb(COALESCE(p_options_json, '[]')),
            NULLIF(p_question_text_en, ''),
            CASE WHEN p_options_json_en IS NULL THEN NULL ELSE to_jsonb(p_options_json_en) END,
            COALESCE(p_is_active, true)
        )
        RETURNING * INTO r;
    ELSIF v_en THEN
        UPDATE sondas_config
        SET question_text_en = NULLIF(p_question_text_en, ''),
            options_json_en  = CASE WHEN p_options_json_en IS NULL THEN options_json_en ELSE to_jsonb(p_options_json_en) END,
            step_order       = COALESCE(p_step_order, step_order),
            is_active        = COALESCE(p_is_active, is_active)
        WHERE id = p_id RETURNING * INTO r;
    ELSE
        UPDATE sondas_config
        SET question_text = COALESCE(p_question_text, question_text),
            options_json  = CASE WHEN p_options_json IS NULL THEN options_json ELSE to_jsonb(p_options_json) END,
            step_order    = COALESCE(p_step_order, step_order),
            is_active     = COALESCE(p_is_active, is_active)
        WHERE id = p_id RETURNING * INTO r;
    END IF;

    RETURN json_build_object('id', r.id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_sonda(uuid, text, int, text, text, boolean, text, text, text) TO anon, authenticated, service_role;

-- ── C3. Lectura de TODOS los protocolos/calibraciones (incluye _en) ─
DROP FUNCTION IF EXISTS public.get_all_protocolos_admin;
CREATE FUNCTION public.get_all_protocolos_admin()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'pilar', pilar,
        'fase', fase,
        'titulo', titulo,
        'titulo_en', titulo_en,
        'descripcion_corta', descripcion_corta,
        'descripcion_corta_en', descripcion_corta_en,
        'alerta_text', alerta_text,
        'alerta_text_en', alerta_text_en,
        'sugerencia_text', sugerencia_text,
        'sugerencia_text_en', sugerencia_text_en,
        'tareas_json', tareas_json,
        'tareas_json_en', tareas_json_en,
        'is_active', is_active,
        'score_min', score_min,
        'score_max', score_max
    ) ORDER BY pilar, fase), '[]'::json)
    FROM public.libreria_protocolos;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_protocolos_admin() TO anon, authenticated, service_role;

-- ── C4. Upsert de protocolo/calibración (+ _en), SET condicional ────
--   tareas_json guarda un STRING JSON doble-codificado (to_jsonb(<texto>)),
--   idéntico al patrón vivo; el cliente manda JSON.stringify(tareas).
DROP FUNCTION IF EXISTS public.upsert_protocolo_admin;
CREATE FUNCTION public.upsert_protocolo_admin(
    p_id                   uuid    DEFAULT NULL,
    p_pilar                text    DEFAULT NULL,
    p_fase                 int     DEFAULT NULL,
    p_titulo               text    DEFAULT NULL,
    p_descripcion_corta    text    DEFAULT NULL,
    p_alerta_text          text    DEFAULT NULL,
    p_sugerencia_text      text    DEFAULT NULL,
    p_tareas_json          text    DEFAULT NULL,
    p_is_active            boolean DEFAULT true,
    p_score_min            int     DEFAULT NULL,
    p_score_max            int     DEFAULT NULL,
    p_titulo_en            text    DEFAULT NULL,
    p_descripcion_corta_en text    DEFAULT NULL,
    p_alerta_text_en       text    DEFAULT NULL,
    p_sugerencia_text_en   text    DEFAULT NULL,
    p_tareas_json_en       text    DEFAULT NULL,
    p_lang                 text    DEFAULT 'es'
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r    libreria_protocolos%ROWTYPE;
    v_en boolean := (p_lang = 'en');
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO libreria_protocolos (
            pilar, fase, titulo, descripcion_corta, alerta_text, sugerencia_text, tareas_json,
            titulo_en, descripcion_corta_en, alerta_text_en, sugerencia_text_en, tareas_json_en,
            is_active, score_min, score_max
        )
        VALUES (
            p_pilar, COALESCE(p_fase, 1),
            COALESCE(p_titulo, ''), COALESCE(p_descripcion_corta, ''),
            COALESCE(p_alerta_text, ''), COALESCE(p_sugerencia_text, ''),
            to_jsonb(COALESCE(p_tareas_json, '[]')),
            NULLIF(p_titulo_en, ''), NULLIF(p_descripcion_corta_en, ''),
            NULLIF(p_alerta_text_en, ''), NULLIF(p_sugerencia_text_en, ''),
            CASE WHEN p_tareas_json_en IS NULL THEN NULL ELSE to_jsonb(p_tareas_json_en) END,
            COALESCE(p_is_active, true), COALESCE(p_score_min, 0), COALESCE(p_score_max, 100)
        )
        RETURNING * INTO r;
    ELSIF v_en THEN
        UPDATE libreria_protocolos
        SET titulo_en            = NULLIF(p_titulo_en, ''),
            descripcion_corta_en = NULLIF(p_descripcion_corta_en, ''),
            alerta_text_en       = NULLIF(p_alerta_text_en, ''),
            sugerencia_text_en   = NULLIF(p_sugerencia_text_en, ''),
            tareas_json_en       = CASE WHEN p_tareas_json_en IS NULL THEN tareas_json_en ELSE to_jsonb(p_tareas_json_en) END,
            fase       = COALESCE(p_fase, fase),
            is_active  = COALESCE(p_is_active, is_active),
            score_min  = COALESCE(p_score_min, score_min),
            score_max  = COALESCE(p_score_max, score_max),
            updated_at = now()
        WHERE id = p_id RETURNING * INTO r;
    ELSE
        UPDATE libreria_protocolos
        SET titulo            = COALESCE(p_titulo, titulo),
            descripcion_corta = COALESCE(p_descripcion_corta, descripcion_corta),
            alerta_text       = COALESCE(p_alerta_text, alerta_text),
            sugerencia_text   = COALESCE(p_sugerencia_text, sugerencia_text),
            tareas_json       = CASE WHEN p_tareas_json IS NULL THEN tareas_json ELSE to_jsonb(p_tareas_json) END,
            fase       = COALESCE(p_fase, fase),
            is_active  = COALESCE(p_is_active, is_active),
            score_min  = COALESCE(p_score_min, score_min),
            score_max  = COALESCE(p_score_max, score_max),
            updated_at = now()
        WHERE id = p_id RETURNING * INTO r;
    END IF;

    RETURN json_build_object('id', r.id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_protocolo_admin(uuid, text, int, text, text, text, text, text, boolean, int, int, text, text, text, text, text, text) TO anon, authenticated, service_role;

COMMIT;

-- Nota de seguridad (pre-existente, no introducida aquí): get_all_sondas,
-- get_all_protocolos_admin, upsert_sonda y upsert_protocolo_admin son anon-
-- ejecutables (las llama el editor con la anon key). Solo las usa el Motor. Si
-- alguna vez se endurecen, hay que rutearlas por un gateway verificado y migrar
-- el cliente a adminAction() — fuera del alcance de esta migración.
