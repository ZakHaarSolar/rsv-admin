-- Red Solar Viva · LA LISTA DE LUZY TAMBIÉN EN PORTUGUÉS (holaluzy.com/pt, 2026-10-21)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run. Idempotente (se puede pegar dos veces).
--
-- Va después de 20261020_luzy_lista (ya pegada). La página en portugués de Brasil (holaluzy.com/pt) manda idioma 'pt'
-- desde la función luzy-lista v1.1; hasta que se pegue esto, luzy_apuntar lo guarda como 'es' (no falla, solo queda con
-- otro idioma). Cambia dos cosas: la columna idioma acepta 'pt' y luzy_apuntar lo guarda. Lo demás de la función queda
-- igual que en 20261020_luzy_lista. Probada en PGlite 0.2.17 (admin/supabase/pruebas/luzy/).

-- ── (1) El idioma de la lista: español, inglés o portugués ─────────────
ALTER TABLE public.luzy_lista DROP CONSTRAINT IF EXISTS luzy_lista_idioma_check;
ALTER TABLE public.luzy_lista ADD CONSTRAINT luzy_lista_idioma_check CHECK (idioma IN ('es', 'en', 'pt'));

-- ── (2) Apuntar, ahora con 'pt' (igual que en 20261020_luzy_lista en todo lo demás) ──
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
    v_idioma text := CASE WHEN p_idioma IN ('en', 'pt') THEN p_idioma ELSE 'es' END;
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

    -- El freno por conexión (ventana corta y larga) y el cortacircuitos general.
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
