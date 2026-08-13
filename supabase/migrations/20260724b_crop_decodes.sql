-- 20260724b_crop_decodes.sql
-- MURO DEL DECODIFICADOR DE CROP CIRCLES.
--
-- Regla acordada con Zak: el REGISTRO es libre para siempre (planeta, años,
-- lista, ficha con ubicación, coordenadas, fecha, foto y reconstrucción del
-- patrón). Lo que se paga es el SIGNIFICADO: la decodificación.
--
--   · Sin suscripción: 3 decodificaciones libres DE POR VIDA, y el Tripulante
--     ELIGE cuáles (el contador vive a la vista, la decisión es suya).
--   · Re-abrir una que ya descifró NO gasta otra: se guarda QUÉ crop se
--     descifró, no un simple contador.
--   · Con suscripción: todas, siempre.
--
-- Espejo estructural de 20260724_vision_sessions.sql.

CREATE TABLE IF NOT EXISTS public.crop_decodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    crop_id UUID NOT NULL REFERENCES public.crop_circles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crop_decodes_unique_per_user UNIQUE (clerk_user_id, crop_id)
);

CREATE INDEX IF NOT EXISTS idx_crop_decodes_user
    ON public.crop_decodes (clerk_user_id, created_at DESC);

ALTER TABLE public.crop_decodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insert_own_crop_decode ON public.crop_decodes;
CREATE POLICY insert_own_crop_decode ON public.crop_decodes
    FOR INSERT WITH CHECK (clerk_user_id IS NOT NULL);

-- ── RPCs ────────────────────────────────────────────────────────────────

-- Devuelve { count, ids[] }: el contador para la UI y la lista de los que ya
-- descifró (para no cobrarle dos veces el mismo).
CREATE OR REPLACE FUNCTION public.get_my_crop_decodes(
    target_clerk_id TEXT
)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'count', COALESCE(COUNT(*), 0)::INT,
        'ids', COALESCE(json_agg(crop_id ORDER BY created_at DESC), '[]'::json)
    )
    FROM public.crop_decodes
    WHERE clerk_user_id = target_clerk_id;
$$;

-- Idempotente: descifrar el mismo crop dos veces no consume una segunda.
CREATE OR REPLACE FUNCTION public.record_crop_decode(
    p_clerk_user_id TEXT,
    p_crop_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' OR p_crop_id IS NULL THEN
        RETURN -1;
    END IF;
    INSERT INTO public.crop_decodes (clerk_user_id, crop_id)
    VALUES (p_clerk_user_id, p_crop_id)
    ON CONFLICT (clerk_user_id, crop_id) DO NOTHING;
    SELECT COUNT(*)::INT INTO v_count
    FROM public.crop_decodes
    WHERE clerk_user_id = p_clerk_user_id;
    RETURN v_count;
END;
$$;

-- Solo el gateway (service_role): el id lo pone el servidor desde el token.
REVOKE ALL ON FUNCTION public.get_my_crop_decodes(TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_crop_decode(TEXT, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_crop_decodes(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_crop_decode(TEXT, UUID) TO service_role;

REVOKE ALL ON public.crop_decodes FROM anon, authenticated;
