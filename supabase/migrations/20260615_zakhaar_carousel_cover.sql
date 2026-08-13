-- 20260615_zakhaar_carousel_cover.sql
-- Atelier · Zak'Haar Posts — portada manual del carrusel.
-- Permite subir una imagen de portada (mini portada) por carrusel para
-- identificarlo visualmente en el panel una vez publicado (igual que la portada
-- de los storyboards del Estudio Manual). La imagen vive en R2; aquí solo la URL.
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

ALTER TABLE public.zakhaar_carousels
    ADD COLUMN IF NOT EXISTS cover_image_url text;

-- RPC actualizada: ahora devuelve cover_image_url por carrusel.
CREATE OR REPLACE FUNCTION public.get_zakhaar_carousels_admin(
    p_admin_clerk_id text,
    p_style text DEFAULT NULL,
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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(sub) ORDER BY sub.generated_at DESC)
    INTO v_result
    FROM (
        SELECT
            c.id,
            c.style_key,
            c.slides_count,
            c.concept_title,
            c.narrative,
            c.caption,
            c.hashtags,
            c.pulso_nucleo,
            c.status,
            c.is_published,
            c.generated_at,
            c.generated_by_clerk_id,
            c.cover_image_url,
            COALESCE((
                SELECT json_agg(row_to_json(sl) ORDER BY sl.slide_index)
                FROM (
                    SELECT
                        s.id,
                        s.slide_index,
                        s.slide_label,
                        s.copy_line,
                        s.prompt_image,
                        s.director_note,
                        s.image_r2_url
                    FROM public.zakhaar_carousel_slides s
                    WHERE s.carousel_id = c.id
                ) sl
            ), '[]'::json) AS slides
        FROM public.zakhaar_carousels c
        WHERE (p_style IS NULL OR c.style_key = p_style)
          AND c.status <> 'deleted'
        ORDER BY c.generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object(
        'carousels', COALESCE(v_result, '[]'::json)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_zakhaar_carousels_admin(text, text, int)
    TO anon, authenticated, service_role;
