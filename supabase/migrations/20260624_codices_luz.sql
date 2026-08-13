-- 20260624_codices_luz.sql
-- Atelier · Zak'Haar Posts — CÓDICES DE LUZ (extracción de carruseles desde los
-- libros de Zak). Un "Códice" es un libro de Zak destilado UNA vez en un
-- CONCENTRADO (jsonb digest: esencia + voz + enseñanzas + frases + conceptos).
-- Después, cada carrusel se genera A PARTIR de ese concentrado (no del libro
-- completo de 50k tokens) → más barato, más fino y más rápido. La memoria
-- anti-repetición (pulso_nucleo) se filtra por códice para no repetir la misma
-- enseñanza entre carruseles del mismo libro.
--
-- Flujo: panel pega el libro → edge `distill-codice` lo destila (1 vez) → fila
-- en codices_luz. Luego el panel elige un códice como FUENTE y el edge
-- `generate-zakhaar-carousel` (con codice_id) construye el carrusel sobre UNA
-- de sus enseñanzas, en el estilo/modo elegido.
--
-- Lockdown RLS sin policies; acceso por RPCs SECURITY DEFINER (panel) o
-- service_role (edges). Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- 1. TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.codices_luz (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,                         -- título del libro
    author text NOT NULL DEFAULT '',             -- autor (Zak'Haar Solar)
    full_text text NOT NULL DEFAULT '',          -- texto crudo del libro (para re-destilar)
    digest jsonb NOT NULL,                        -- concentrado: {esencia, voz, ensenanzas[], frases[], conceptos[]}
    status text NOT NULL DEFAULT 'ready',         -- 'ready' | 'deleted'
    generated_by_clerk_id text NOT NULL DEFAULT '',
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT codices_luz_status_chk CHECK (status IN ('ready', 'deleted'))
);

COMMENT ON TABLE public.codices_luz IS
    'Atelier · Códices de Luz — libros de Zak destilados (digest jsonb) como fuente de carruseles. Lockdown RLS sin policies; acceso por RPCs SECURITY DEFINER (panel) o service_role (edges distill-codice / generate-zakhaar-carousel).';
COMMENT ON COLUMN public.codices_luz.digest IS
    'Concentrado reutilizable: { esencia, voz, ensenanzas:[{titulo,idea,metafora,aplicacion}], frases:[], conceptos:[{termino,explicacion}] }. Lo produce el edge distill-codice (1 vez por libro).';

CREATE INDEX IF NOT EXISTS idx_codices_luz_status_generated
    ON public.codices_luz(status, generated_at DESC);

ALTER TABLE public.codices_luz ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. COLUMNA codice_id en zakhaar_carousels (qué códice originó el carrusel)
-- ============================================================

ALTER TABLE public.zakhaar_carousels
    ADD COLUMN IF NOT EXISTS codice_id uuid REFERENCES public.codices_luz(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.zakhaar_carousels.codice_id IS
    'Si el carrusel se generó desde un Códice de Luz, su id. null = fuente genérica (Sexta Densidad). El pulso_nucleo de estos carruseles = el título de la enseñanza usada (anti-repetición por libro).';

CREATE INDEX IF NOT EXISTS idx_zakhaar_carousels_codice
    ON public.zakhaar_carousels(codice_id, generated_at DESC)
    WHERE codice_id IS NOT NULL;

-- ============================================================
-- 3. RPC: get_codices_luz_admin — lista los códices (sin el digest pesado)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_codices_luz_admin(
    p_admin_clerk_id text
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
            c.title,
            c.author,
            COALESCE(jsonb_array_length(c.digest -> 'ensenanzas'), 0) AS ensenanzas_count,
            c.generated_at
        FROM public.codices_luz c
        WHERE c.status <> 'deleted'
        ORDER BY c.generated_at DESC
    ) sub;

    RETURN json_build_object('codices', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_codices_luz_admin(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 4. RPC: delete_codice_luz_admin — soft delete
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_codice_luz_admin(
    p_admin_clerk_id text,
    p_id uuid
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

    UPDATE public.codices_luz SET status = 'deleted' WHERE id = p_id;
    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_codice_luz_admin(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- 5. RPC actualizada: get_zakhaar_carousels_admin — ahora devuelve codice_id
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
            c.dialogo_mode,
            c.codice_id,
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

    RETURN json_build_object('carousels', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_zakhaar_carousels_admin(text, text, int)
    TO anon, authenticated, service_role;
