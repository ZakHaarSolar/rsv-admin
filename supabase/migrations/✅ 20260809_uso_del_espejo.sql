-- 🜂 PANEL DE USO DEL ESPEJO — la lectura que faltaba
-- ---------------------------------------------------------------------------
-- Zak (2026-08-09): "que en el menú del header se abra una ventana de uso y
-- diga cuánto llevan y cuánto les queda: audio, texto e imágenes".
--
-- El consumo YA se registra: los tres carriles (reflejos, voz e imágenes)
-- pasan por `reserve_edge_spend`, que escribe en `edge_spend_ledger`. Lo que
-- no existía era forma de LEERLO: esa función solo reserva cupo y devuelve
-- sí/no, nunca cuánto se lleva gastado. Esto lo agrega, sin tocar nada de lo
-- que ya corre.
--
-- Identificadores tal como los escriben las edges hoy:
--   · 'oraculo-dia'     reflejos del día              (tope 150/persona)
--   · 'espejo-imagen'   imágenes generadas            (tope 2/día)
--   · 'espejo-voz'      unidades de voz del día       (600 = 1 hora real)
--   · 'espejo-voz-mes'  unidades de voz del mes       (5.000 = ~8 horas)
-- Una unidad de voz son 100 caracteres, ~6 segundos de habla: por eso el
-- cliente puede convertirlas a MINUTOS, que es la unidad que la persona vive.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_espejo_uso(p_clerk_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reflejos int;
    v_imagenes int;
    v_voz_dia  int;
    v_voz_mes  int;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'sin_usuario');
    END IF;

    -- Las ventanas son las MISMAS que usa reserve_edge_spend al reservar:
    -- día = 24 h hacia atrás, mes = 30 días. No se cuenta por fecha de
    -- calendario a propósito, para que la lectura coincida con el cobro.
    SELECT COALESCE(SUM(cost_units), 0) INTO v_reflejos
      FROM edge_spend_ledger
     WHERE user_key = p_clerk_user_id AND edge = 'oraculo-dia'
       AND created_at > now() - interval '24 hours';

    SELECT COALESCE(SUM(cost_units), 0) INTO v_imagenes
      FROM edge_spend_ledger
     WHERE user_key = p_clerk_user_id AND edge = 'espejo-imagen'
       AND created_at > now() - interval '24 hours';

    SELECT COALESCE(SUM(cost_units), 0) INTO v_voz_dia
      FROM edge_spend_ledger
     WHERE user_key = p_clerk_user_id AND edge = 'espejo-voz'
       AND created_at > now() - interval '24 hours';

    SELECT COALESCE(SUM(cost_units), 0) INTO v_voz_mes
      FROM edge_spend_ledger
     WHERE user_key = p_clerk_user_id AND edge = 'espejo-voz-mes'
       AND created_at > now() - interval '30 days';

    -- Solo los NÚMEROS. Los topes y las palabras viven en el cliente, que es
    -- quien sabe si la persona es miembro y en qué idioma le habla.
    RETURN jsonb_build_object(
        'ok', true,
        'reflejos_dia', v_reflejos,
        'imagenes_dia', v_imagenes,
        'voz_dia_unidades', v_voz_dia,
        'voz_mes_unidades', v_voz_mes
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_espejo_uso(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_espejo_uso(text) TO service_role;

COMMENT ON FUNCTION public.get_espejo_uso(text) IS
'Uso del Espejo por persona en sus ventanas de cobro (reflejos, imágenes y voz día/mes). Solo lee edge_spend_ledger; el cupo lo sigue gobernando reserve_edge_spend. La llama la edge oraculo-chat con service_role, nunca el cliente.';
