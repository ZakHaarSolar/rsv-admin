-- 20260504_avatar_signature.sql
--
-- Sprint 5 · Rito de Encarnación — Domo Cero.
--
-- Persiste la firma geométrica del Avatar (Material + Polaridad) que el
-- Tripulante elige la primera vez que cruza el portal hacia la Academia
-- Solar. En accesos siguientes el server lee estos campos y dispara el
-- haz de luz directamente, saltando la pantalla de selección.
--
-- · avatar_material : 'cristal' | 'plasma' | 'biopolimero'
-- · avatar_polarity : 'alfa' | 'omega'
--
-- Ambas columnas son NULL hasta que el Tripulante completa su primer
-- descenso. Una vez seteadas, persisten para siempre. Para "mutar"
-- el avatar (Cámara de Reconfiguración futura), simplemente se vuelve
-- a llamar set_avatar_signature_by_clerk_id con valores nuevos —
-- la RPC hace UPSERT idempotente.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_material text NULL
        CHECK (avatar_material IS NULL OR avatar_material IN ('cristal','plasma','biopolimero')),
    ADD COLUMN IF NOT EXISTS avatar_polarity text NULL
        CHECK (avatar_polarity IS NULL OR avatar_polarity IN ('alfa','omega'));

-- ──────────────────────────────────────────────────────────────────
-- get_avatar_signature_by_clerk_id
-- Devuelve la firma del Tripulante o NULL si nunca confirmó.
-- SECURITY DEFINER bypassa RLS de profiles para que el server del
-- Domo (que usa anon key) pueda leerla.
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_avatar_signature_by_clerk_id(
    p_clerk_id text
)
RETURNS TABLE (material text, polarity text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT p.avatar_material, p.avatar_polarity
    FROM public.profiles p
    WHERE p.clerk_user_id = p_clerk_id
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_avatar_signature_by_clerk_id(text)
    TO anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- set_avatar_signature_by_clerk_id
-- UPSERT idempotente. Si el profile no existe lo crea (mínimo viable);
-- si ya existe actualiza solo los dos campos. Llamada desde el server
-- del Domo cuando el Tripulante confirma su descenso (SPAWN_REQUEST)
-- y desde una futura Cámara de Reconfiguración para mutar el avatar.
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_avatar_signature_by_clerk_id(
    p_clerk_id text,
    p_material text,
    p_polarity text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_id IS NULL OR length(p_clerk_id) = 0 THEN
        RAISE EXCEPTION 'clerk_id requerido';
    END IF;
    IF p_material NOT IN ('cristal','plasma','biopolimero') THEN
        RAISE EXCEPTION 'material inválido: %', p_material;
    END IF;
    IF p_polarity NOT IN ('alfa','omega') THEN
        RAISE EXCEPTION 'polaridad inválida: %', p_polarity;
    END IF;

    INSERT INTO public.profiles (clerk_user_id, avatar_material, avatar_polarity)
    VALUES (p_clerk_id, p_material, p_polarity)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET avatar_material = EXCLUDED.avatar_material,
        avatar_polarity = EXCLUDED.avatar_polarity;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_avatar_signature_by_clerk_id(text, text, text)
    TO anon, authenticated;
