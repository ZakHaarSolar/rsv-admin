-- Red Solar Viva · El canal de CONTACTO de redsolarviva.com (Zak 2026-08-31)
-- ===========================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- La antena de la portada abre un formulario de contacto que entra DIRECTO
-- al buzón de Soporte del Motor de Intervención (support_tickets), sellado
-- como Red Solar Viva: mismo buzón que los casos de la app (que se leen como
-- Escáner Vibracional), un solo lugar para todos los mensajes. Antes viajaba
-- a un webhook de Pipedream que tardaba minutos en despertar.
--
-- · kind = 'contacto' es el sello: el Motor lo pinta como RED SOLAR VIVA y
--   todo lo demás como ESCÁNER VIBRACIONAL. Cero columnas nuevas.
-- · Entra como status 'nuevo' → el faro de no-leídos del Motor (migración
--   20260830b, admin_get_unread_counts) lo cuenta solo, sin tocar nada.
-- · Puerta pública anónima (la portada no pide cuenta), con las guardas de
--   la casa: valida, recorta, y anti-inundación global de 20 por hora
--   (suficiente para personas; inútil para un robot, que además cae en la
--   miel del formulario antes de llegar aquí).

CREATE OR REPLACE FUNCTION public.submit_contacto_rsv(
    p_nombre  TEXT DEFAULT '',
    p_correo  TEXT DEFAULT '',
    p_mensaje TEXT DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre  text := LEFT(btrim(COALESCE(p_nombre, '')), 120);
    v_correo  text := LOWER(LEFT(btrim(COALESCE(p_correo, '')), 200));
    v_msg     text := LEFT(btrim(COALESCE(p_mensaje, '')), 4000);
    v_recientes integer;
    v_id      uuid;
BEGIN
    IF length(v_msg) < 2 THEN
        RETURN json_build_object('ok', false, 'error', 'vacio');
    END IF;
    IF v_correo = '' OR position('@' IN v_correo) = 0 THEN
        RETURN json_build_object('ok', false, 'error', 'correo_invalido');
    END IF;

    SELECT count(*) INTO v_recientes
    FROM support_tickets
    WHERE kind = 'contacto'
      AND created_at > now() - interval '1 hour';
    IF v_recientes >= 20 THEN
        RETURN json_build_object('ok', false, 'error', 'demasiados');
    END IF;

    INSERT INTO support_tickets (kind, email, message, fields, platform, status)
    VALUES (
        'contacto',
        v_correo,
        v_msg,
        jsonb_build_object(
            'nombre', v_nombre,
            'origen', 'redsolarviva.com'
        ),
        'web',
        'nuevo'
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('ok', true, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contacto_rsv(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contacto_rsv(TEXT, TEXT, TEXT)
    TO anon, authenticated, service_role;
