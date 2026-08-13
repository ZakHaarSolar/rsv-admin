-- 20260601b_vtli_colectivos.sql
-- BIBLIOTECA DE COLECTIVOS (civilizaciones) del universo Zak'Haar.
--
-- Cada colectivo define una ESPECIE con rasgos FIJOS (lo que la hace reconocible)
-- + un margen de VARIACIÓN INDIVIDUAL leve: cada generación es un individuo
-- distinto de la misma especie (como dos humanos — claramente humanos, pero cada
-- uno diferente). El entorno y la paleta del universo son fijos aparte (en el
-- system prompt); el colectivo define SOLO el ser.
--
-- Híbrido texto + imagen: species_traits/individual_variation (texto) viajan al
-- prompt siempre (funcionan en modo "solo prompts", gratis). image_r2_url es la
-- imagen de referencia opcional (Fase B: cargador en el panel).

CREATE TABLE IF NOT EXISTS public.vtli_colectivos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,           -- nombre del colectivo (selector del panel)
    species_traits text NOT NULL,        -- rasgos FIJOS de la especie (van al prompt)
    individual_variation text,           -- margen de variación individual leve
    image_r2_url text,                   -- imagen de referencia (opcional, Fase B)
    category text,                       -- 'zakhaar' | 'veo' | NULL = universal
    active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vtli_colectivos_active
    ON public.vtli_colectivos(active, sort_order);

-- RPC: lista de colectivos activos (admin-only), para el selector del panel.
CREATE OR REPLACE FUNCTION public.get_vtli_colectivos(
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
    SELECT is_admin INTO v_is_admin
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
        SELECT id, name, species_traits, individual_variation, image_r2_url,
               category, sort_order
        FROM public.vtli_colectivos
        WHERE active = true
          AND (p_category IS NULL OR category IS NULL OR category = p_category)
    ) sub;

    RETURN json_build_object('colectivos', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vtli_colectivos(text, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- SEED: los 2 colectivos iniciales (de las imágenes de referencia de Zak).
-- Idempotente por UNIQUE(name).
-- ============================================================
INSERT INTO public.vtli_colectivos
    (name, species_traits, individual_variation, category, sort_order)
VALUES
(
    'Cristalinos',
    'Humanoide esbelto y grácil de la civilización Cristalina: piel nacarada de tono gris-perla con sutiles vetas lila y verdosas y un patrón fino de escamas/puntos sobre el cráneo; cabeza alargada y lisa sin cabello, frente amplia con una cresta central sutil; ojos grandes, claros y serenos de iris plateado-cristalino; rasgos finos, apacibles y sabios; viste una túnica larga de hilos plateados tejidos que brilla como seda metálica. Aire de archivista y sabio interdimensional.',
    'Cada individuo Cristalino es único dentro de la misma especie: variá SUTILMENTE el tono de piel (más perla, más lila o más plata), la densidad del patrón del cráneo, el color del iris (plata, oro pálido o cian claro), la edad aparente y la expresión. Claramente de la misma civilización, pero un ser distinto — como dos humanos distintos.',
    'zakhaar',
    1
),
(
    'Tejedores de Luz',
    'Humanoide alto y estilizado de la civilización Tejedora: exoestructura lisa azul-marino profundo con placas de porcelana blanco-perlada iridiscente en pecho, hombros y cráneo; cráneo alargado y liso; del dorso, la espalda y la nuca brotan numerosos filamentos finos de luz blanca (como nervios o cables luminosos) que fluyen hacia atrás; extremidades largas y delgadas; rostro sereno de rasgos suaves. Aire de navegante y tejedor de redes de luz.',
    'Cada individuo Tejedor es único dentro de la misma especie: variá SUTILMENTE la proporción de azul vs blanco perla, la cantidad y el largo de los filamentos de luz, el matiz iridiscente (azul, violeta o cian) y el patrón de las placas. Claramente de la misma civilización, pero un ser distinto.',
    'zakhaar',
    2
)
ON CONFLICT (name) DO NOTHING;

-- Verificación:
--   SELECT name, category, sort_order FROM public.vtli_colectivos ORDER BY sort_order;
