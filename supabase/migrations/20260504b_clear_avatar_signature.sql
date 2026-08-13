-- 20260504b_clear_avatar_signature.sql
--
-- Sprint 5 · Cámara de Reconfiguración — borra la firma persistida
-- del Tripulante para que en su próximo acceso aparezca el selector
-- desde cero (sin auto-encarnación).
--
-- Llamada por el server del Domo cuando recibe RECONFIGURE_REQUEST
-- (botón "Elegir avatar" del menú top-right). Idempotente: si el
-- profile no existía o ya era null, no falla.

CREATE OR REPLACE FUNCTION public.clear_avatar_signature_by_clerk_id(
    p_clerk_id text
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

    UPDATE public.profiles
    SET avatar_material = NULL,
        avatar_polarity = NULL
    WHERE clerk_user_id = p_clerk_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_avatar_signature_by_clerk_id(text)
    TO anon, authenticated;
