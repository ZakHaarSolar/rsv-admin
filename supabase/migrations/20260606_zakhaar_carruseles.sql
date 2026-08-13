-- 20260606_zakhaar_carruseles.sql
-- Atelier de Marketing · Zak'Haar Posts — CARRUSELES de Instagram.
-- Un "carrusel" es un post de 5-8 imágenes (slides) de Zak'Haar con un
-- estilo visual ÚNICO elegido entre 3 lanes de marca. Modo SOLO PROMPTS:
-- el motor entrega el prompt de cada slide listo para copiar/pegar en
-- Nano Banana (plan Pro, $0). La NOTA DE REFERENCIA por slide (qué slide
-- previo subir como referencia para conservar el mismo ser) viaja en un
-- campo aparte (director_note), NUNCA dentro del prompt de Nano Banana.
--
-- Decisión: DOS tablas espejo del patrón vtli_drafts → zakhaar_carousels
-- (el concepto) + zakhaar_carousel_slides (las N imágenes). Lockdown RLS
-- sin policies; acceso por RPCs SECURITY DEFINER (panel) o service_role
-- (edge generate-zakhaar-carousel). Aplicar pegando este archivo completo
-- en Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- 1. TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.zakhaar_carousels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    style_key text NOT NULL,                          -- 'silicio' | 'tablilla' | 'vitral'
    slides_count smallint NOT NULL DEFAULT 6,         -- 5..8
    concept_title text NOT NULL,                      -- título corto del carrusel
    narrative text NOT NULL DEFAULT '',               -- arco del carrusel (referencia Zak)
    caption text NOT NULL DEFAULT '',                 -- caption Instagram completo (con CTA)
    hashtags text[] NOT NULL DEFAULT '{}',
    pulso_nucleo text,                                -- memoria anti-repetición
    status text NOT NULL DEFAULT 'prompts_ready',     -- 'prompts_ready' | 'generating' | 'images_ready' | 'deleted'
    is_published boolean NOT NULL DEFAULT false,      -- marca manual de publicado
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    generated_by_clerk_id text NOT NULL,
    CONSTRAINT zakhaar_carousels_status_chk
        CHECK (status IN ('prompts_ready','generating','images_ready','deleted'))
);

COMMENT ON TABLE public.zakhaar_carousels IS
    'Atelier · Zak''Haar Posts — carruseles de Instagram (5-8 slides). Un carrusel = concepto narrativo con estilo único (silicio/tablilla/vitral). Lockdown via RLS sin policies; acceso por RPCs SECURITY DEFINER (panel) o service_role (edge generate-zakhaar-carousel). Modo solo-prompts: image_r2_url de los slides queda null.';

CREATE TABLE IF NOT EXISTS public.zakhaar_carousel_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    carousel_id uuid NOT NULL REFERENCES public.zakhaar_carousels(id) ON DELETE CASCADE,
    slide_index smallint NOT NULL,                    -- orden 0..N-1
    slide_label text NOT NULL,                        -- "Portada" · "Desarrollo" · "Cierre"
    copy_line text,                                   -- frase/overlay/enseñanza de ese slide
    prompt_image text NOT NULL,                       -- prompt Nano Banana LIMPIO (listo para copiar)
    director_note text,                               -- NOTA para Zak: qué slide previo subir como referencia. null/'' = nada
    image_r2_url text,                                -- null en modo solo-prompts (futuro: modo API)
    created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.zakhaar_carousel_slides.prompt_image IS
    'Prompt Nano Banana LIMPIO y auto-suficiente, listo para copiar/pegar. SIN referencias cruzadas ("#1") ni instrucciones humanas — eso va en director_note.';
COMMENT ON COLUMN public.zakhaar_carousel_slides.director_note IS
    'Instrucción para el HUMANO (Zak): si este slide reutiliza un ser/elemento de un slide previo, dice qué imagen subir como referencia a Nano Banana. null o vacío = el slide no usa referencias (el panel no muestra nada).';

-- Índices
CREATE INDEX IF NOT EXISTS idx_zakhaar_carousels_status_generated
    ON public.zakhaar_carousels(status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_zakhaar_carousels_style_generated
    ON public.zakhaar_carousels(style_key, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_zakhaar_carousel_slides_carousel
    ON public.zakhaar_carousel_slides(carousel_id, slide_index);

-- ============================================================
-- 2. RLS habilitado SIN POLICIES (lockdown total)
-- ============================================================

ALTER TABLE public.zakhaar_carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakhaar_carousel_slides ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RPC: get_zakhaar_carousels_admin
-- Devuelve los N carruseles más recientes (con slides anidados),
-- filtrables por estilo. Excluye 'deleted'. Admin-only.
-- ============================================================

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

-- ============================================================
-- 4. RPC: delete_zakhaar_carousel (soft delete)
-- Preserva el pulso_nucleo para la memoria anti-repetición.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_zakhaar_carousel(
    p_admin_clerk_id text,
    p_carousel_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.zakhaar_carousels
    SET status = 'deleted'
    WHERE id = p_carousel_id;

    RETURN json_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_zakhaar_carousel(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC: set_zakhaar_carousel_published (toggle publicado)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_zakhaar_carousel_published(
    p_admin_clerk_id text,
    p_carousel_id uuid,
    p_published boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.zakhaar_carousels
    SET is_published = COALESCE(p_published, false)
    WHERE id = p_carousel_id;

    RETURN json_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION public.set_zakhaar_carousel_published(text, uuid, boolean)
    TO anon, authenticated, service_role;
