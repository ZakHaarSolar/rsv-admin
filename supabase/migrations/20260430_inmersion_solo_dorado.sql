-- 20260430_inmersion_solo_dorado.sql
-- Reglas afinadas tras pregunta de Zak:
--
-- 1) Inmersión Solar recibe SOLO el cristal dorado (codice). El
--    cristal cyan no aplica porque Inmersión tiene acceso libre a
--    todas las meditaciones — entregar cristal cyan que nunca se
--    gasta inflaría el indicador con un contador sin significado.
--    Sintonía Solar sigue recibiendo los dos cristales.
--
-- 2) Cuando un Tripulante de Inmersión escucha una meditación, la
--    registramos en `meditaciones_owned` con
--    `acquired_via='inmersion_libre'`. Si más adelante se desuscribe,
--    esas meditaciones quedan abiertas para siempre — el privilegio
--    se ancla al uso real, no al cristal abstracto. Lo hacemos vía
--    una RPC `register_meditacion_inmersion_libre` que el frontend
--    llama (idempotente, ya cubierto por UNIQUE en la tabla).

-- ─────────────────────────────────────────────────────────────────
-- 1. emit_cristales_for_subscription — Inmersión solo dorado
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emit_cristales_for_subscription(
    p_clerk_user_id text,
    p_origen text,
    p_mes_lunar text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_already_emitted int;
    v_mes text;
    v_emitted int;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'clerk_user_id requerido',
            'emitted', 0
        );
    END IF;
    IF p_origen NOT IN ('sintonia', 'inmersion', 'manual') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'origen inválido',
            'emitted', 0
        );
    END IF;

    v_mes := COALESCE(NULLIF(p_mes_lunar, ''), to_char(now(), 'YYYY-MM'));

    SELECT count(*)::int INTO v_already_emitted
    FROM public.cristales_extraccion
    WHERE clerk_user_id = p_clerk_user_id
      AND mes_lunar = v_mes
      AND origen = p_origen;

    IF v_already_emitted > 0 THEN
        RETURN json_build_object(
            'success', true,
            'already_emitted', true,
            'count', v_already_emitted,
            'emitted', 0,
            'mes_lunar', v_mes
        );
    END IF;

    /* v2 — Reglas por origen:
         · sintonia → 1 codice + 1 meditacion (dos cristales).
         · inmersion → 1 codice solamente (las meditaciones son
           libres para Inmersión, no necesitan cristal cyan).
         · manual → ambos (escenario de soporte / regalo). */
    IF p_origen = 'inmersion' THEN
        INSERT INTO public.cristales_extraccion
            (clerk_user_id, tipo, origen, mes_lunar)
        VALUES
            (p_clerk_user_id, 'codice', p_origen, v_mes);
        v_emitted := 1;
    ELSE
        INSERT INTO public.cristales_extraccion
            (clerk_user_id, tipo, origen, mes_lunar)
        VALUES
            (p_clerk_user_id, 'codice', p_origen, v_mes),
            (p_clerk_user_id, 'meditacion', p_origen, v_mes);
        v_emitted := 2;
    END IF;

    RETURN json_build_object(
        'success', true,
        'already_emitted', false,
        'emitted', v_emitted,
        'mes_lunar', v_mes
    );
END $$;

-- (Las grants existentes siguen vigentes; el CREATE OR REPLACE
-- preserva los privilegios anteriores.)

-- ─────────────────────────────────────────────────────────────────
-- 2. RPC: register_meditacion_inmersion_libre
-- Registra el acceso de un Tripulante de Inmersión a una meditación
-- en `meditaciones_owned` con acquired_via='inmersion_libre'. Es
-- idempotente (UNIQUE constraint en la tabla). Si el Tripulante se
-- desuscribe luego, mantiene el acceso a las meditaciones que ya
-- escuchó durante su Inmersión. La RPC NO valida que el Tripulante
-- sea Inmersión (lo hace el frontend antes de llamar) — si alguien
-- llama directo, simplemente quedará registrada esa meditación,
-- sin consecuencias adversas.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.register_meditacion_inmersion_libre(
    p_clerk_user_id text,
    p_meditacion_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing int;
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_meditacion_id IS NULL OR p_meditacion_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'meditacion_id requerido');
    END IF;

    SELECT count(*)::int INTO v_existing
    FROM public.meditaciones_owned
    WHERE clerk_user_id = p_clerk_user_id
      AND meditacion_id = p_meditacion_id;

    IF v_existing > 0 THEN
        RETURN json_build_object(
            'success', true,
            'already_registered', true
        );
    END IF;

    INSERT INTO public.meditaciones_owned
        (clerk_user_id, meditacion_id, acquired_via)
    VALUES
        (p_clerk_user_id, p_meditacion_id, 'inmersion_libre')
    ON CONFLICT (clerk_user_id, meditacion_id) DO NOTHING;

    RETURN json_build_object(
        'success', true,
        'already_registered', false
    );
END $$;

GRANT EXECUTE ON FUNCTION public.register_meditacion_inmersion_libre(text, text)
    TO anon, authenticated, service_role;
