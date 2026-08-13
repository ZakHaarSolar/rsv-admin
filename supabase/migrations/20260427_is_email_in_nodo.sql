-- Red Solar Viva · is_email_in_nodo
-- =====================================================================
-- Lectura pública rápida: ¿este email está suscrito al Nodo Central?
-- Lo consume CicloSellado (segundo correo automatizado del flujo) para
-- decidir qué footer renderizar:
--   in_nodo=true  → footer normal con [Ajustar Frecuencia de Señales].
--   in_nodo=false → bloque "[ FIN DE TRANSMISIÓN OPERATIVA ]" con CTA
--                    "[Encender Receptor]" para que la persona se
--                    suscriba si lo desea (último envío automatizado
--                    del ciclo de calibración).
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.is_email_in_nodo(
    p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    IF v_email IS NULL OR v_email = '' THEN
        RETURN false;
    END IF;
    RETURN EXISTS (SELECT 1 FROM public.nodo_central WHERE email = v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_email_in_nodo(TEXT)
    TO anon, authenticated;
