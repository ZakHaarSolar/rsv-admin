-- Red Solar Viva · LA LISTA DE LUZY: EL BOLETÍN DE PAPÁS Y EL AVISO DEL LIBRO (holaluzy.com, 2026-10-20)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run. Idempotente (se puede pegar dos veces).
--
-- La página de Luzy (holaluzy.com, una producción de Fotón Cero) junta el correo de mamá, papá o quien cuida para dos
-- listas: el boletín de papás (con los dibujos para colorear de regalo) y el aviso del primer libro. La página nunca toca
-- la base: llama a la función luzy-lista (admin/supabase/functions/luzy-lista), que corre con la llave de servicio y
-- guarda con luzy_apuntar. Probada en PGlite 0.2.17 (admin/supabase/pruebas/luzy/).
--
-- (1) luzy_lista: un renglón por correo, con sus dos listas, su idioma, la versión del aviso de privacidad que aceptó y
--     cuándo confirmó que es mayor de edad. Cerrada: la llave pública y las sesiones no la leen ni la escriben.
-- (2) luzy_freno: la cuenta de registros por conexión. Guarda una huella que la función saca de la IP con su secreto y el
--     día (no se puede volver IP ni seguir de un día a otro), y se borra sola a los dos días.
-- (3) luzy_apuntar(...): revisa, frena y apunta en un solo paso. Solo la llama la función (service_role).
--     Los correos del dominio reservado @prueba.holaluzy.com pasan por todo (validación y freno) pero no se guardan: así
--     se prueba la página publicada sin ensuciar la lista.
--
-- Esta lista es solo de Luzy: no se mezcla con los correos del Escáner (admin_get_subscribers no la lee) y el aviso de
-- privacidad dice que el correo se usa solo para los avisos de Luzy.
--
-- Para verla: Table Editor -> luzy_lista, o
--     select count(*) filter (where boletin) as boletin, count(*) filter (where libro) as libro from public.luzy_lista;
-- Para borrar a alguien que lo pida (o que se dé de baja):
--     delete from public.luzy_lista where correo = lower('alguien@correo.com');

-- ── (1) La lista ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.luzy_lista (
    correo        text PRIMARY KEY CHECK (correo = lower(correo) AND length(correo) <= 254),
    boletin       boolean NOT NULL DEFAULT false,   -- el boletín de papás (con los dibujos para colorear)
    libro         boolean NOT NULL DEFAULT false,   -- el aviso de cuando salga el primer libro
    idioma        text NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
    aviso         text NOT NULL,                    -- la versión del aviso de privacidad que aceptó (idioma-fecha)
    mayor_edad    timestamptz NOT NULL,             -- cuándo confirmó que es mayor de edad (la casilla)
    creado        timestamptz NOT NULL DEFAULT now(),
    actualizado   timestamptz NOT NULL DEFAULT now(),
    avisado_libro timestamptz                       -- cuándo se le avisó que salió el libro
);
ALTER TABLE public.luzy_lista ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luzy_lista FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_luzy_lista_creado ON public.luzy_lista (creado DESC);

-- ── (2) El freno ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.luzy_freno (
    huella text NOT NULL,
    creado timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.luzy_freno ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luzy_freno FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_luzy_freno_huella ON public.luzy_freno (huella, creado DESC);
CREATE INDEX IF NOT EXISTS idx_luzy_freno_creado ON public.luzy_freno (creado);

-- ── (3) Apuntar ──────────────────────────────────────────────────────
-- Devuelve {ok: true} · {ok: true, prueba: true} · {ok: false, motivo: 'correo' | 'lista' | 'freno' | 'freno_general'}.
-- Volver a mandar el mismo correo no duplica: suma la otra lista, toma el idioma y el aviso más recientes y renueva la
-- fecha de la casilla de mayor de edad.
CREATE OR REPLACE FUNCTION public.luzy_apuntar(
    p_correo             text,
    p_lista              text,
    p_idioma             text,
    p_aviso              text,
    p_huella             text,
    p_limite_hora        int DEFAULT 20,
    p_limite_dia         int DEFAULT 60,
    p_limite_global_hora int DEFAULT 600
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_correo text := lower(trim(coalesce(p_correo, '')));
    v_idioma text := CASE WHEN p_idioma = 'en' THEN 'en' ELSE 'es' END;
    v_huella text := coalesce(nullif(trim(p_huella), ''), 'sin-huella');
    v_n      int;
BEGIN
    -- El borde real de la base: la página y la función ya revisan, pero aquí se revisa otra vez.
    IF length(v_correo) > 254 OR v_correo !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$' THEN
        RETURN jsonb_build_object('ok', false, 'motivo', 'correo');
    END IF;
    IF p_lista IS NULL OR p_lista NOT IN ('boletin', 'libro') THEN
        RETURN jsonb_build_object('ok', false, 'motivo', 'lista');
    END IF;

    -- Una conexión a la vez: dos envíos juntos se forman en fila y el segundo cuenta al primero.
    PERFORM pg_advisory_xact_lock(hashtextextended('luzy|' || v_huella, 20261020));

    -- El freno por conexión (ventana corta y larga) y el cortacircuitos general (una avalancha repartida en muchas
    -- conexiones); holgados a propósito para no morder a familias reales que comparten la IP de su compañía de celular.
    IF p_limite_hora > 0 THEN
        SELECT count(*) INTO v_n FROM luzy_freno WHERE huella = v_huella AND creado > now() - interval '1 hour';
        IF v_n >= p_limite_hora THEN RETURN jsonb_build_object('ok', false, 'motivo', 'freno'); END IF;
    END IF;
    IF p_limite_dia > 0 THEN
        SELECT count(*) INTO v_n FROM luzy_freno WHERE huella = v_huella AND creado > now() - interval '1 day';
        IF v_n >= p_limite_dia THEN RETURN jsonb_build_object('ok', false, 'motivo', 'freno'); END IF;
    END IF;
    IF p_limite_global_hora > 0 THEN
        SELECT count(*) INTO v_n FROM luzy_freno WHERE creado > now() - interval '1 hour';
        IF v_n >= p_limite_global_hora THEN RETURN jsonb_build_object('ok', false, 'motivo', 'freno_general'); END IF;
    END IF;

    INSERT INTO luzy_freno (huella) VALUES (v_huella);
    -- Limpieza sin cron: 1 de cada 20 llamadas barre lo de hace más de dos días.
    IF random() < 0.05 THEN
        DELETE FROM luzy_freno WHERE creado < now() - interval '2 days';
    END IF;

    -- El dominio reservado de las pruebas: pasó por todo, no se guarda.
    IF v_correo LIKE '%@prueba.holaluzy.com' THEN
        RETURN jsonb_build_object('ok', true, 'prueba', true);
    END IF;

    INSERT INTO luzy_lista AS l (correo, boletin, libro, idioma, aviso, mayor_edad)
    VALUES (v_correo, p_lista = 'boletin', p_lista = 'libro', v_idioma,
            coalesce(nullif(trim(p_aviso), ''), 'sin-version'), now())
    ON CONFLICT (correo) DO UPDATE SET
        boletin     = l.boletin OR EXCLUDED.boletin,
        libro       = l.libro OR EXCLUDED.libro,
        idioma      = EXCLUDED.idioma,
        aviso       = EXCLUDED.aviso,
        mayor_edad  = EXCLUDED.mayor_edad,
        actualizado = now();

    RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.luzy_apuntar(text, text, text, text, text, int, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.luzy_apuntar(text, text, text, text, text, int, int, int) TO service_role;

NOTIFY pgrst, 'reload schema';
