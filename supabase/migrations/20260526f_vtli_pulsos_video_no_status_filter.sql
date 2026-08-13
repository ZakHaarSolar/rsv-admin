-- 20260526f_vtli_pulsos_video_no_status_filter.sql
-- ============================================================
-- Fix anti-repetición de pilares en Atelier de Video Zak'Haar.
--
-- Bug detectado 2026-05-26 noche: dos Reels consecutivos cayeron
-- en el mismo pilar (Física de la Voluntad) porque la memoria
-- anti-repetición devolvía vacío. Causa raíz: el RPC original
-- get_recent_pulsos_nucleo_video filtra por
--   status IN ('approved', 'published')
-- pero el flow operativo de Zak es DESCARGAR + PUBLICAR MANUAL
-- en Instagram — nunca toca el botón "Aprobar" en el panel.
-- Resultado: el historial siempre estaba vacío y Gemini no
-- tenía pulsos previos para evitar repetir conceptos/pilares.
--
-- Cambio: ahora traemos TODOS los pulsos recientes que NO sean
-- 'rejected'. Eso cubre draft (default — Zak descarga sin
-- aprobar) + approved + published + rerolled. Un rerolled
-- igual sirve como pulso a evitar (era el mismo concepto).
-- Solo 'rejected' (Zak marcó como malo) NO debe contar — esos
-- conceptos PUEDEN repetirse buscando un mejor render.
--
-- Aplica también a posts (mismo bug latente — Zak descarga sin
-- aprobar). Migración separada en 20260526g si se confirma.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recent_pulsos_nucleo_video(
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
    SELECT json_agg(pulso_nucleo ORDER BY generated_at DESC)
    INTO v_result
    FROM (
        SELECT pulso_nucleo, generated_at
        FROM public.vtli_videos
        WHERE category::text = p_category
          AND status::text != 'rejected'
          AND pulso_nucleo IS NOT NULL
          AND length(trim(pulso_nucleo)) > 0
        ORDER BY generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 30), 1)
    ) sub;

    RETURN json_build_object(
        'pulsos', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_recent_pulsos_nucleo_video(text, int)
    TO anon, authenticated, service_role;
