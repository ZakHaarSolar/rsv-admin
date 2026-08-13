-- 20260527_vtli_soft_delete_videos.sql
-- ============================================================
-- Soft delete para vtli_videos + memoria anti-repetición intacta.
--
-- Bug detectado 2026-05-27: Zak borró un Reel del Pilar 2 (Cuerpo
-- de Silicio) desde el panel del Atelier, y al volver a picar
-- "Generar 1 Zak'Haar Reel" Gemini eligió el mismo Pilar 2 otra
-- vez. Causa raíz: `delete_vtli_video` hacía DELETE físico de la
-- fila, así que el pulso_nucleo desaparecía de la memoria y la
-- prohibición del pilar se perdía.
--
-- Fix: convertir el delete a SOFT DELETE. La fila se queda en DB
-- con status='deleted' (el panel la filtra fuera del listado) pero
-- el pulso_nucleo sigue siendo visible para el RPC anti-repetición.
-- Resultado: aunque Zak borre el Reel del panel, ese pilar queda
-- prohibido para los próximos N Reels.
--
-- Aplicar pegando este archivo completo en Supabase Dashboard →
-- SQL Editor → New Query → Run.
-- ============================================================

-- ============================================================
-- 1. Sumar 'deleted' al enum vtli_video_status
-- IF NOT EXISTS garantiza idempotencia.
-- ============================================================

ALTER TYPE vtli_video_status ADD VALUE IF NOT EXISTS 'deleted';

-- ============================================================
-- 2. RPC delete_vtli_video → soft delete
-- En lugar de DELETE FROM, hacemos UPDATE status='deleted'.
-- El row queda en DB para preservar la memoria anti-repetición.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_vtli_video(
    p_admin_clerk_id text,
    p_video_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_count int;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- SOFT DELETE: marca status='deleted'. La fila SIGUE en DB
    -- para preservar pulso_nucleo en la memoria anti-repetición.
    UPDATE public.vtli_videos
    SET status = 'deleted'::vtli_video_status,
        reviewed_at = NOW(),
        reviewed_by_clerk_id = p_admin_clerk_id
    WHERE id = p_video_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        RETURN json_build_object('error', 'video_not_found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'video_id', p_video_id,
        'mode', 'soft_delete'
    );
END $$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_video(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- 3. RPC get_recent_vtli_videos → EXCLUIR 'deleted' del listado
-- El panel del Atelier NO debe ver los videos borrados.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_vtli_videos(
    p_admin_clerk_id text,
    p_category text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit int DEFAULT 30
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
            category::text AS category,
            target,
            aha_moment,
            prompt_visual,
            caption,
            hashtags,
            pulso_nucleo,
            video_r2_url,
            duration_seconds,
            replicate_prediction_id,
            status::text AS status,
            generated_at,
            generated_by_clerk_id,
            reroll_count,
            parent_video_id,
            reviewed_at,
            reviewed_by_clerk_id
        FROM public.vtli_videos
        WHERE (p_category IS NULL OR category::text = p_category)
          AND (p_status IS NULL OR status::text = p_status)
          AND status::text != 'deleted'
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object(
        'videos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_vtli_videos(text, text, text, int)
    TO anon, authenticated, service_role;

-- ============================================================
-- 4. RPC get_atelier_video_dashboard → EXCLUIR 'deleted' de counts
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_atelier_video_dashboard(
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
        'month_generated_veo_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE category = 'veo'
              AND generated_at >= v_month_start
              AND status::text != 'deleted'
        ),
        'month_generated_zakhaar_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE category = 'zakhaar'
              AND generated_at >= v_month_start
              AND status::text != 'deleted'
        ),
        'month_approved_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE status = 'approved' AND reviewed_at >= v_month_start
        ),
        'month_published_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE status = 'published' AND reviewed_at >= v_month_start
        ),
        'total_lifetime_video', (
            SELECT COUNT(*) FROM public.vtli_videos
            WHERE status::text != 'deleted'
        )
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_atelier_video_dashboard(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. get_recent_pulsos_nucleo_video — NO se modifica.
-- La versión 20260526f ya filtra por `status != 'rejected'`, lo
-- cual INCLUYE 'deleted' (deleted no es rejected). Esto es lo
-- correcto: el pulso de un Reel borrado SIGUE contando para la
-- memoria anti-repetición. Si Zak quisiera "reusar" un pilar
-- borrado, debe usar `rejected` (que sí excluye del historial).
-- ============================================================

-- ============================================================
-- 6. Verificación opcional (descomentar para validar):
-- SELECT enumlabel FROM pg_enum WHERE enumtypid =
--   'vtli_video_status'::regtype ORDER BY enumsortorder;
-- Debe listar: draft, approved, rejected, rerolled, published, deleted
-- ============================================================
