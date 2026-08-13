-- 20260603d_soma_categories.sql
-- SOMA CERO · Atelier — CATEGORÍAS DE CONTENIDO (no sabores). Suma 'conciencia'
-- y 'memes' al enum de categoría + actualiza el dashboard para contar por
-- categoría. Los sabores futuros (más allá del Waffle Cero) serán otro eje
-- (selector de producto) cuando lleguen; estas categorías son TIPO DE CONTENIDO.
--
-- ⚠️ Si el editor envuelve todo en una sola transacción y los dos ALTER TYPE de
-- abajo fallan con "ALTER TYPE ... cannot run inside a transaction block",
-- selecciona SOLO esas 2 líneas, dales Run, y después corre el resto del archivo.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

-- ============================================================
-- 1. NUEVOS VALORES DEL ENUM (tipo de contenido)
-- ============================================================

ALTER TYPE public.soma_post_category ADD VALUE IF NOT EXISTS 'conciencia';
ALTER TYPE public.soma_post_category ADD VALUE IF NOT EXISTS 'memes';

-- ============================================================
-- 2. get_soma_atelier_dashboard — conteo por categoría
--    (usa ::text para ser seguro ante valores de enum recién agregados)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_soma_atelier_dashboard(
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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_month_start := date_trunc('month', NOW());

    RETURN json_build_object(
        'is_admin', true,
        'month_generated_waffle', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE category::text = 'waffle' AND generated_at >= v_month_start
        ),
        'month_generated_conciencia', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE category::text = 'conciencia' AND generated_at >= v_month_start
        ),
        'month_generated_memes', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE category::text = 'memes' AND generated_at >= v_month_start
        ),
        'month_generated_total', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE generated_at >= v_month_start
        ),
        'month_approved', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_published', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime', (
            SELECT COUNT(*) FROM public.soma_posts
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_soma_atelier_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- Validar:
--   SELECT get_soma_atelier_dashboard(clerk_user_id)
--     FROM profiles WHERE is_admin = true LIMIT 1;
-- ============================================================
