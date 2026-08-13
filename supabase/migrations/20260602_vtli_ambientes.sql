-- 20260602_vtli_ambientes.sql
-- BIBLIOTECA DE AMBIENTES (entornos/escenarios) del universo Zak'Haar.
-- Espejo de vtli_colectivos: el COLECTIVO fija el SER, el AMBIENTE fija el
-- ESCENARIO. Ambos dentro del MISMO universo holográfico cristalino (la paleta
-- y la estética son la marca fija; el ambiente define el escenario concreto).
--
-- scene_traits (texto) viaja al prompt siempre (funciona en modo solo prompts).
-- variation = qué puede variar dentro del ambiente entre Reels.
-- image_r2_url = imagen de referencia opcional (cargador con visión, Fase B).
--
-- Chequeo admin con bool_or (tolera perfiles duplicados) y created_at SÍ va en
-- las subconsultas del json_agg (evita el error 42703 que tuvo el selector de
-- colectivos).

CREATE TABLE IF NOT EXISTS public.vtli_ambientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    scene_traits text NOT NULL,        -- cómo es el ambiente (va al prompt)
    variation text,                    -- qué varía dentro entre Reels
    image_r2_url text,                 -- imagen de referencia (opcional)
    category text,                     -- 'zakhaar' | 'veo' | NULL = universal
    active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vtli_ambientes_active
    ON public.vtli_ambientes(active, sort_order);

-- ============================================================
-- SELECTOR — solo activos (para el selector del panel).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vtli_ambientes(
    p_admin_clerk_id text,
    p_category text DEFAULT NULL
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

    SELECT COALESCE(
        json_agg(row_to_json(sub) ORDER BY sub.sort_order, sub.created_at),
        '[]'::json
    )
    INTO v_result
    FROM (
        SELECT id, name, scene_traits, variation, image_r2_url,
               category, sort_order, created_at
        FROM public.vtli_ambientes
        WHERE active = true
          AND (p_category IS NULL OR category IS NULL OR category = p_category)
    ) sub;

    RETURN json_build_object('ambientes', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vtli_ambientes(text, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- LISTA COMPLETA (gestión) — activos e inactivos.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vtli_ambientes_admin(
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

    SELECT COALESCE(
        json_agg(row_to_json(sub) ORDER BY sub.sort_order, sub.created_at),
        '[]'::json
    )
    INTO v_result
    FROM (
        SELECT id, name, scene_traits, variation, image_r2_url,
               category, active, sort_order, created_at
        FROM public.vtli_ambientes
    ) sub;

    RETURN json_build_object('ambientes', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vtli_ambientes_admin(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- UPSERT — crear (p_id NULL) o editar un ambiente.
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_vtli_ambiente(
    p_admin_clerk_id text,
    p_id uuid,
    p_name text,
    p_scene_traits text,
    p_variation text,
    p_image_r2_url text,
    p_category text DEFAULT NULL,
    p_sort_order int DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_row public.vtli_ambientes%ROWTYPE;
    v_name text := btrim(COALESCE(p_name, ''));
    v_traits text := btrim(COALESCE(p_scene_traits, ''));
    v_cat text := NULLIF(btrim(COALESCE(p_category, '')), '');
    v_sort int;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF v_name = '' THEN
        RETURN json_build_object('error', 'name_required');
    END IF;
    IF v_traits = '' THEN
        RETURN json_build_object('error', 'scene_traits_required');
    END IF;

    BEGIN
        IF p_id IS NULL THEN
            SELECT COALESCE(p_sort_order, COALESCE(MAX(sort_order), 0) + 1)
            INTO v_sort
            FROM public.vtli_ambientes;

            INSERT INTO public.vtli_ambientes
                (name, scene_traits, variation, image_r2_url,
                 category, active, sort_order)
            VALUES
                (v_name, v_traits, NULLIF(btrim(COALESCE(p_variation, '')), ''),
                 NULLIF(btrim(COALESCE(p_image_r2_url, '')), ''),
                 v_cat, true, v_sort)
            RETURNING * INTO v_row;
        ELSE
            UPDATE public.vtli_ambientes
            SET name = v_name,
                scene_traits = v_traits,
                variation = NULLIF(btrim(COALESCE(p_variation, '')), ''),
                image_r2_url = NULLIF(btrim(COALESCE(p_image_r2_url, '')), ''),
                category = v_cat,
                sort_order = COALESCE(p_sort_order, sort_order)
            WHERE id = p_id
            RETURNING * INTO v_row;

            IF NOT FOUND THEN
                RETURN json_build_object('error', 'not_found');
            END IF;
        END IF;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN json_build_object('error', 'name_taken');
    END;

    RETURN json_build_object('ambiente', row_to_json(v_row));
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_vtli_ambiente(
    text, uuid, text, text, text, text, text, int
) TO anon, authenticated, service_role;

-- ============================================================
-- ACTIVAR / DESACTIVAR
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_vtli_ambiente_active(
    p_admin_clerk_id text,
    p_id uuid,
    p_active boolean
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

    UPDATE public.vtli_ambientes
    SET active = COALESCE(p_active, true)
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_vtli_ambiente_active(text, uuid, boolean)
    TO anon, authenticated, service_role;

-- ============================================================
-- BORRAR — la imagen en R2 NO se borra acá.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_vtli_ambiente(
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

    DELETE FROM public.vtli_ambientes WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_ambiente(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- SEED: 2 ambientes iniciales (mismos del few-shot del edge de visión).
-- Idempotente por UNIQUE(name).
-- ============================================================
INSERT INTO public.vtli_ambientes
    (name, scene_traits, variation, category, sort_order)
VALUES
(
    'Biblioteca de Cristal',
    'Gran biblioteca-archivo de cristal del universo holográfico: columnas translúcidas altísimas, hileras de tablillas de luz flotantes cubiertas de glifos dorados, piso pulido con reflejos iridiscentes, partículas de luz suspendidas y god rays suaves entre las columnas. Arquitectura sagrada, limpia y luminosa, toda en cristal, plata, blanco perla y dorado. Aire de archivo cósmico del conocimiento.',
    'Entre Reels puede variar SUTILMENTE: la densidad de tablillas y glifos flotantes, la altura y separación de las columnas, la cantidad de partículas y god rays, y si al fondo se insinúa el cosmos o solo el cristal. Siempre la misma biblioteca de cristal, pero cada toma muestra un rincón distinto.',
    'zakhaar',
    1
),
(
    'Cubierta Orbital',
    'Cubierta o domo de una nave cristalina del universo holográfico: gran ventanal translúcido al cosmos, hologramas de datos de luz flotando en el aire, anillos de geometría sagrada dorada girando lento, superficies de cristal sin costuras con reflejos iridiscentes y azul cósmico profundo del espacio. Tecnología lumínica del futuro, nunca retro. Aire de puente de mando sereno entre las estrellas.',
    'Entre Reels puede variar SUTILMENTE: si se ve un planeta, una nebulosa o solo el campo de estrellas por el ventanal, la cantidad de hologramas y anillos de geometría, y el ángulo de la cubierta. Siempre la misma cubierta de cristal, pero cada toma es un rincón distinto.',
    'zakhaar',
    2
)
ON CONFLICT (name) DO NOTHING;

-- Verificación:
--   SELECT name, active, sort_order FROM public.vtli_ambientes ORDER BY sort_order;
