-- 20260704d_i18n_active_protocols.sql
-- FASE 3 i18n — get_my_active_protocols por idioma (la 3ª vía de lectura de las
-- Calibraciones: la vista de calibraciones EN CURSO del tripulante, que embebe el
-- contenido de libreria_protocolos vía join). Añade p_lang + respaldo campo-por-campo.
-- Reproduce el cuerpo VIVO (pasado por Zak) sin cambiar su lógica; solo localiza los
-- campos del protocolo embebido. Requiere las columnas _en (20260704_i18n_content_en_columns.sql).
--
-- Pegar en Supabase Dashboard → SQL Editor → Run.

DROP FUNCTION IF EXISTS public.get_my_active_protocols(text);
CREATE FUNCTION public.get_my_active_protocols(
    p_clerk_user_id text,
    p_lang text DEFAULT 'es'
) RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
        SELECT e.*,
            (
                SELECT row_to_json(lp)
                FROM (
                    SELECT lp.pilar, lp.fase,
                        CASE WHEN p_lang = 'en' THEN COALESCE(NULLIF(lp.titulo_en, ''), lp.titulo) ELSE lp.titulo END AS titulo,
                        CASE WHEN p_lang = 'en' THEN COALESCE(NULLIF(lp.descripcion_corta_en, ''), lp.descripcion_corta) ELSE lp.descripcion_corta END AS descripcion_corta,
                        CASE WHEN p_lang = 'en' THEN COALESCE(NULLIF(lp.alerta_text_en, ''), lp.alerta_text) ELSE lp.alerta_text END AS alerta_text,
                        CASE WHEN p_lang = 'en' THEN COALESCE(NULLIF(lp.sugerencia_text_en, ''), lp.sugerencia_text) ELSE lp.sugerencia_text END AS sugerencia_text,
                        CASE WHEN p_lang = 'en' THEN COALESCE(lp.tareas_json_en, lp.tareas_json) ELSE lp.tareas_json END AS tareas_json
                    FROM public.libreria_protocolos lp
                    WHERE lp.id = e.protocolo_id
                ) lp
            ) AS protocolo
        FROM public.estado_tripulante_protocolos e
        WHERE e.clerk_user_id = p_clerk_user_id
          AND e.estado <> 'INTEGRADO'
    ) t;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_active_protocols(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_active_protocols(text, text) TO service_role;
