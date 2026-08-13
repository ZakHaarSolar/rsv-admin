-- 🜂 VELOCÍMETRO · EL REGISTRO COMPLETO (la curva de mejora)
-- ---------------------------------------------------------------------------
-- Zak (2026-08-11): "queremos un registro y una gráfica como la de
-- trayectoria: a través del tiempo cómo vamos mejorando; acceso a la lista de
-- cuándo hicimos cuánto". La primera versión de get_dictado_records devolvía
-- solo las últimas 5 mediciones y sin palabras ni segundos: suficiente para
-- el rótulo del récord, corto para dibujar una curva.
--
-- Esto REEMPLAZA la función de lectura (CREATE OR REPLACE): ahora devuelve
-- hasta 100 mediciones con todo su cuerpo (ppm, fidelidad, palabras,
-- segundos, fecha). La tabla y la función de guardado no se tocan.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_dictado_records(p_clerk_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mejor int;
    v_n     int;
    v_ult   jsonb;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'sin_usuario');
    END IF;

    SELECT MAX(ppm), COUNT(*) INTO v_mejor, v_n
      FROM dictado_records
     WHERE clerk_user_id = p_clerk_user_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC), '[]'::jsonb)
      INTO v_ult
      FROM (
            SELECT ppm, fidelidad, palabras, segundos, created_at
              FROM dictado_records
             WHERE clerk_user_id = p_clerk_user_id
             ORDER BY created_at DESC
             LIMIT 100
           ) f;

    RETURN jsonb_build_object(
        'ok', true,
        'mejor_ppm', v_mejor,
        'intentos', COALESCE(v_n, 0),
        'ultimas', v_ult
    );
END;
$$;
