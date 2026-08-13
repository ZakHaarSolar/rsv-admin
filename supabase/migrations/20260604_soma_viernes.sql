-- 20260604_soma_viernes.sql
-- SOMA CERO · Atelier — NUEVA CATEGORÍA DE CONTENIDO: 'viernes' (anuncio de
-- apertura semanal con cierre fijo del menú). Suma el valor al enum + agrega su
-- conteo al dashboard. Los demás RPCs (get_recent_soma_posts,
-- get_soma_posts_by_ids, get_recent_soma_pulsos, update/delete/publish) ya son
-- genéricos por ::text y NO requieren cambios.
--
-- ⚠️ Si el editor envuelve todo en una sola transacción y el ALTER TYPE de abajo
-- falla con "ALTER TYPE ... cannot run inside a transaction block", selecciona
-- SOLO esa línea, dale Run, y después corre el resto del archivo.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- 1. NUEVO VALOR DEL ENUM (tipo de contenido)
-- ============================================================

ALTER TYPE public.soma_post_category ADD VALUE IF NOT EXISTS 'viernes';

-- ============================================================
-- 2. get_soma_atelier_dashboard — suma el conteo de 'viernes'
--    (usa ::text para ser seguro ante el valor de enum recién agregado)
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
        'month_generated_viernes', (
            SELECT COUNT(*) FROM public.soma_posts
            WHERE category::text = 'viernes' AND generated_at >= v_month_start
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
