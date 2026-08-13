-- 20260527b_vtli_atelier_calibracion_sintonia.sql
-- Atelier de Marketing — suma los 2 pilares restantes de VEO TU LUZ
-- INTERNA al enum de categorías: Calibración Biológica (calibracion) y
-- Sintonía de Núcleo (sintonia). Eso permite generar posts Instagram
-- para los 4 pilares VTLI desde el mismo sub-tab del panel.
--
-- También actualiza get_atelier_dashboard para devolver counts del mes
-- de los 4 pilares (el frontend v1.13 los renderiza como 4 stats).
--
-- Aplicar pegando este archivo completo en Supabase Dashboard →
-- SQL Editor → New Query → Run.

-- ============================================================
-- 1. ENUM — sumar los 2 valores nuevos
-- ============================================================

ALTER TYPE public.vtli_post_category ADD VALUE IF NOT EXISTS 'calibracion';
ALTER TYPE public.vtli_post_category ADD VALUE IF NOT EXISTS 'sintonia';

-- ============================================================
-- 2. RPC get_atelier_dashboard — reemplazo con 4 counts
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_atelier_dashboard(
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
    -- Admin gate
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
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE category = 'veo' AND generated_at >= v_month_start
        ),
        'month_generated_telekinesis', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE category = 'telekinesis' AND generated_at >= v_month_start
        ),
        'month_generated_calibracion', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE category = 'calibracion' AND generated_at >= v_month_start
        ),
        'month_generated_sintonia', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE category = 'sintonia' AND generated_at >= v_month_start
        ),
        'month_approved', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_rejected', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'rejected' AND reviewed_at >= v_month_start
        ),
        'month_rerolled', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'rerolled' AND reviewed_at >= v_month_start
        ),
        'month_published', (
            SELECT COUNT(*) FROM public.vtli_posts
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime', (
            SELECT COUNT(*) FROM public.vtli_posts
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_atelier_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- Validación post-aplicación:
--   SELECT enum_range(NULL::public.vtli_post_category);
--   -- esperado: {veo, telekinesis, calibracion, sintonia}
--
--   SELECT public.get_atelier_dashboard(clerk_user_id)
--     FROM public.profiles WHERE is_admin = true LIMIT 1;
--   -- esperado: keys month_generated_calibracion / month_generated_sintonia presentes con valor 0
-- ============================================================
