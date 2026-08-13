-- 20260527d_vtli_banners_format_pivot.sql
-- Atelier de Marketing — pivote del enum vtli_banner_format hacia los
-- 2 formatos canónicos de Instagram. Cambios estratégicos:
--   · Eliminamos Facebook landscape (publicidad solo Instagram).
--   · Cambiamos feed cuadrado por feed 4:5 vertical (1080×1350) que
--     es el formato más alto que Instagram permite sin cropping
--     automático. Instagram cropea cualquier cosa más vertical que
--     4:5 → si subimos 3:4 (1080×1440), Instagram lo recorta a 4:5
--     perdiendo ~6% del contenido inferior (CTA).
--
-- Postgres NO permite DROP de valores existentes en un enum sin
-- recrear el tipo entero (ALTER TYPE … DROP VALUE no existe). Los
-- valores legacy 'feed_square' y 'fb_landscape' quedan en el enum
-- pero NO se usan más desde la edge function ni el frontend. Si en
-- algún momento aparece un banner viejo con esos formatos, sigue
-- siendo válido en DB pero se filtra del histórico via SQL.
--
-- Solo se agrega el nuevo valor 'feed_portrait'.
--
-- También se actualiza get_atelier_banners_dashboard para devolver
-- el nuevo count month_generated_feed_portrait (en lugar de
-- month_generated_feed que apuntaba a feed_square). El de stories
-- queda igual.
--
-- Aplicar pegando este archivo completo en Supabase Dashboard →
-- SQL Editor → New Query → Run.

-- ============================================================
-- 1. ENUM — sumar 'feed_portrait' (4:5 1080×1350)
-- ============================================================

ALTER TYPE public.vtli_banner_format ADD VALUE IF NOT EXISTS 'feed_portrait';

-- ============================================================
-- 2. RPC get_atelier_banners_dashboard — reemplazo
-- Pivote del count de feed: ahora cuenta feed_portrait (no
-- feed_square). El landscape queda fuera (publicidad solo
-- Instagram desde 2026-05-27).
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
        'month_generated_feed_portrait', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE banner_format = 'feed_portrait'
              AND status::text <> 'deleted'
              AND generated_at >= v_month_start
        ),
        'month_generated_stories', (
            SELECT COUNT(*) FROM public.vtli_banners
            WHERE banner_format = 'stories_9x16'
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
-- Validación post-aplicación:
--   SELECT enum_range(NULL::vtli_banner_format);
--   -- esperado: {feed_square, stories_9x16, fb_landscape, feed_portrait}
--   (los 3 primeros son legacy del v1.0 y quedan en el enum
--    aunque la edge function v1.1 ya no los emite)
--
--   SELECT public.get_atelier_banners_dashboard(clerk_user_id)
--     FROM public.profiles WHERE is_admin = true LIMIT 1;
--   -- esperado: key month_generated_feed_portrait presente
-- ============================================================
