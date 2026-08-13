-- 20260527c_vtli_banners.sql
-- Atelier de Marketing — universo paralelo de BANNERS publicitarios
-- para Meta Ads VTLI Cancún. Tabla espejo de vtli_posts pero con
-- anatomía ad-ready: hook directo + subtexto fijo + CTA + URL visible.
--
-- Diferencia conceptual con vtli_posts:
--   · vtli_posts  = obra orgánica para feed Instagram (poética,
--                   Dancing Script, sin CTA explícito).
--   · vtli_banners = obra publicitaria SOLO para Ads Manager (hook
--                   directo, CTA imperativo, URL visible). NUNCA se
--                   publica al feed orgánico. Vive aislada en su
--                   propia tabla, propio enum de status, propio
--                   sub-tab del panel.
--
-- Cada concepto creativo se materializa en 3 formatos canónicos:
--   · feed_square  · 1080×1080 · feed IG/FB
--   · stories_9x16 · 1080×1920 · Stories + Reels static
--   · fb_landscape · 1200×628  · FB ad landscape + sidebar
--
-- Los 3 formatos del MISMO concepto comparten concept_id (UUID
-- agrupador), category, hook, subtext, cta_label, cta_url. Cada
-- formato tiene su propio prompt_visual (composición ajustada al
-- aspect ratio) e image_r2_url propio.
--
-- Aplicar pegando este archivo completo en Supabase Dashboard →
-- SQL Editor → New Query → Run.

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE vtli_banner_format AS ENUM (
        'feed_square',   -- 1080×1080 · feed IG/FB
        'stories_9x16',  -- 1080×1920 · Stories + Reels static
        'fb_landscape'   -- 1200×628 · FB ad landscape + sidebar
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE vtli_banner_status AS ENUM (
        'draft',      -- recién generado, esperando review
        'approved',   -- Zak aprobó (concepto sólido, copy listo)
        'rejected',   -- Zak descartó este formato/concepto
        'rerolled',   -- Zak pidió variante, este queda padre
        'published',  -- ya exportado a Meta Ads Manager (marca manual)
        'deleted'     -- soft delete (pulso queda en memoria anti-rep)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vtli_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- concept_id agrupa los 3 formatos del MISMO concepto creativo.
    -- Generamos el UUID en la edge function y lo pasamos a las 3
    -- filas (1 por formato) en un solo INSERT batch.
    concept_id uuid NOT NULL,
    -- Reusa el enum vtli_post_category (4 pilares VTLI).
    category vtli_post_category NOT NULL,
    banner_format vtli_banner_format NOT NULL,
    -- Audience target (perfil del visitor que tiene que picar el ad).
    target text NOT NULL,
    -- Anatomía ad-ready (campos NUEVOS vs vtli_posts):
    hook text NOT NULL,           -- 3-7 palabras grandes overlay
    subtext text NOT NULL,        -- línea geo-local fija
    cta_label text NOT NULL,      -- "Reservá tu sesión"
    cta_url text NOT NULL,        -- "veotuluzinterna.com"
    -- Campos compartidos con vtli_posts:
    aha_moment text NOT NULL,     -- concepto cualitativo
    prompt_visual text NOT NULL,  -- prompt completo a Nano Banana 2
    pulso_nucleo text,            -- resumen 1 oración del concepto
    image_r2_url text,            -- se popula en background
    status vtli_banner_status NOT NULL DEFAULT 'draft',
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    generated_by_clerk_id text NOT NULL,
    reroll_count int NOT NULL DEFAULT 0,
    -- parent_banner_id apunta al banner padre si nació de un reroll.
    parent_banner_id uuid REFERENCES public.vtli_banners(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    reviewed_by_clerk_id text
);

COMMENT ON TABLE public.vtli_banners IS
    'Atelier de Marketing — banners ad-ready para Meta Ads VTLI Cancún. Cada concepto creativo se materializa en 3 formatos (feed_square, stories_9x16, fb_landscape) agrupados por concept_id. Lockdown via RLS sin policies, acceso solo por RPCs SECURITY DEFINER o service_role (edge function generate-vtli-banners).';

COMMENT ON COLUMN public.vtli_banners.concept_id IS
    'UUID que agrupa los 3 formatos del MISMO concepto creativo. Misma fila lógica = 3 filas físicas (1 por banner_format) con concept_id idéntico.';

COMMENT ON COLUMN public.vtli_banners.hook IS
    '3-7 palabras hook grandes sans-serif overlay. Anatomía ad-ready: directo, imperativo, no Dancing Script poético.';

COMMENT ON COLUMN public.vtli_banners.subtext IS
    'Línea geo-local fija, típicamente "Cancún · Sesiones presenciales 1:1" o variantes. Mantiene anclaje territorial en el ad.';

COMMENT ON COLUMN public.vtli_banners.cta_label IS
    'Texto del botón CTA visible: "Reservá tu sesión", "Conoce los 4 pilares", etc. Imperativo, conversión-driven.';

COMMENT ON COLUMN public.vtli_banners.cta_url IS
    'URL destino del ad, típicamente "veotuluzinterna.com". Visible en el banner como tipografía monoespaciada al pie.';

COMMENT ON COLUMN public.vtli_banners.image_r2_url IS
    'URL pública R2 con la imagen generada por Nano Banana 2 en el aspect ratio del banner_format. Path: Veo tu Luz Interna/Banners/{YYYY-MM-DD}/{uuid}.png';

-- Índices para queries comunes del panel
CREATE INDEX IF NOT EXISTS idx_vtli_banners_category_format_generated
    ON public.vtli_banners(category, banner_format, status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_banners_status_generated
    ON public.vtli_banners(status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vtli_banners_concept
    ON public.vtli_banners(concept_id);

CREATE INDEX IF NOT EXISTS idx_vtli_banners_parent
    ON public.vtli_banners(parent_banner_id)
    WHERE parent_banner_id IS NOT NULL;

-- ============================================================
-- 3. RLS habilitado SIN POLICIES (lockdown total)
-- ============================================================

ALTER TABLE public.vtli_banners ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RPC: get_recent_vtli_banners
-- Devuelve los N banners más recientes, filtrables por category /
-- banner_format / status. Filtra status='deleted' del listado por
-- default (los soft-deletes solo se ven si se pide explícito).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_vtli_banners(
    p_admin_clerk_id text,
    p_category text DEFAULT NULL,
    p_banner_format text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit int DEFAULT 60
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(sub) ORDER BY sub.generated_at DESC)
    INTO v_result
    FROM (
        SELECT
            id,
            concept_id,
            category::text AS category,
            banner_format::text AS banner_format,
            target,
            hook,
            subtext,
            cta_label,
            cta_url,
            aha_moment,
            prompt_visual,
            pulso_nucleo,
            image_r2_url,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_banner_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_banners
        WHERE status::text <> 'deleted'
          AND (p_category IS NULL OR category::text = p_category)
          AND (p_banner_format IS NULL OR banner_format::text = p_banner_format)
          AND (p_status IS NULL OR status::text = p_status)
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 300), 1)
    ) sub;

    RETURN json_build_object(
        'banners', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_banners(text, text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC: get_vtli_banners_by_ids
-- Polling: devuelve los banners con sus image_r2_url actualizados.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vtli_banners_by_ids(
    p_admin_clerk_id text,
    p_banner_ids uuid[]
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
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_banner_ids IS NULL OR array_length(p_banner_ids, 1) IS NULL THEN
        RETURN json_build_object('banners', '[]'::json);
    END IF;

    SELECT json_agg(row_to_json(sub))
    INTO v_result
    FROM (
        SELECT
            id,
            concept_id,
            category::text AS category,
            banner_format::text AS banner_format,
            target,
            hook,
            subtext,
            cta_label,
            cta_url,
            aha_moment,
            prompt_visual,
            pulso_nucleo,
            image_r2_url,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_banner_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_banners
        WHERE id = ANY(p_banner_ids)
    ) sub;

    RETURN json_build_object(
        'banners', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_banners_by_ids(text, uuid[])
    TO anon, authenticated, service_role;

-- ============================================================
-- 6. RPC: get_atelier_banners_dashboard
-- Métricas del panel banners: counts por pilar + por formato del
-- mes actual + total histórico.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_atelier_banners_dashboard(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_month_start timestamptz;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_month_start := date_trunc('month', NOW());

    RETURN json_build_object(
        'is_admin', true,
        'month_generated_veo', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE category = 'veo'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_telekinesis', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE category = 'telekinesis'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_calibracion', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE category = 'calibracion'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_sintonia', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE category = 'sintonia'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_feed', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE banner_format = 'feed_square'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_stories', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE banner_format = 'stories_9x16'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_landscape', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE banner_format = 'fb_landscape'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_approved', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_published', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE status::text <> 'deleted'
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_atelier_banners_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 7. RPC: update_vtli_banner_status
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_vtli_banner_status(
    p_admin_clerk_id text,
    p_banner_id uuid,
    p_new_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_id uuid;
    v_updated_status vtli_banner_status;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('approved', 'rejected', 'rerolled', 'published') THEN
        RETURN json_build_object('error', 'invalid_status');
    END IF;

    UPDATE public.vtli_banners
    SET status = p_new_status::vtli_banner_status,
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_banner_id
    RETURNING id, status
    INTO v_updated_id, v_updated_status;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'banner_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'banner_id', v_updated_id,
        'status', v_updated_status::text
    );
END $$;

GRANT EXECUTE ON FUNCTION public.update_vtli_banner_status(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 8. RPC: increment_vtli_banner_reroll_count
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_vtli_banner_reroll_count(
    p_banner_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count int;
BEGIN
    UPDATE public.vtli_banners
    SET reroll_count = reroll_count + 1
    WHERE id = p_banner_id
    RETURNING reroll_count INTO v_new_count;

    RETURN COALESCE(v_new_count, 0);
END $$;

GRANT EXECUTE ON FUNCTION public.increment_vtli_banner_reroll_count(uuid)
    TO service_role;

-- ============================================================
-- 9. RPC: delete_vtli_banner (soft delete patrón canónico)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_vtli_banner(
    p_admin_clerk_id text,
    p_banner_id uuid
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

    -- Soft delete: status='deleted' preserva pulso_nucleo en memoria
    -- anti-repetición de banners (get_recent_pulsos_nucleo_banner
    -- filtra status != 'rejected' que ya excluye también 'deleted').
    UPDATE public.vtli_banners
    SET status = 'deleted',
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_banner_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object('error', 'banner_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'banner_id', v_updated_id
    );
END $$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_banner(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- 10. RPC: get_recent_pulsos_nucleo_banner
-- Memoria anti-repetición conceptual para banners. La edge function
-- la llama antes de generar nuevos para evitar repetir hooks.
-- Filtra status != 'rejected' que incluye también 'deleted'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_pulsos_nucleo_banner(
    p_category text,
    p_limit int DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result json;
BEGIN
    -- Pickea pulsos por concepto (unique concept_id), no por fila.
    -- Las 3 filas del mismo concepto comparten pulso_nucleo, así que
    -- DISTINCT ON evita repetir el mismo pulso 3 veces seguidas.
    SELECT json_agg(pulso ORDER BY ts DESC NULLS LAST)
    INTO v_result
    FROM (
        SELECT DISTINCT ON (concept_id)
            pulso_nucleo AS pulso,
            COALESCE(reviewed_at, generated_at) AS ts
        FROM public.vtli_banners
        WHERE status::text <> 'rejected'
          AND status::text <> 'deleted'
          AND category::text = p_category
          AND pulso_nucleo IS NOT NULL
          AND length(trim(pulso_nucleo)) > 0
        ORDER BY concept_id, COALESCE(reviewed_at, generated_at) DESC NULLS LAST
    ) sub
    LIMIT GREATEST(LEAST(p_limit, 50), 1);

    RETURN json_build_object(
        'pulsos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_pulsos_nucleo_banner(text, int)
    TO service_role;

-- ============================================================
-- Validación post-aplicación:
--   SELECT enum_range(NULL::vtli_banner_format);
--   -- esperado: {feed_square, stories_9x16, fb_landscape}
--
--   SELECT enum_range(NULL::vtli_banner_status);
--   -- esperado: {draft, approved, rejected, rerolled, published, deleted}
--
--   SELECT * FROM public.vtli_banners LIMIT 0;
--
--   SELECT public.get_atelier_banners_dashboard(clerk_user_id)
--     FROM public.profiles WHERE is_admin = true LIMIT 1;
-- ============================================================
