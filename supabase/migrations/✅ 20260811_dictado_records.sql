-- 🜂 VELOCÍMETRO DE DICTADO — el récord de cada cuenta
-- ---------------------------------------------------------------------------
-- Zak (2026-08-11): la Matriz Sincrónica se alimenta de lo que dictas afuera,
-- así que su medida natural no es cuánto escribes: es a qué velocidad hablas.
-- El velocímetro toma el tiempo de una lectura en voz alta y lo cruza con lo
-- que la herramienta de dictado transcribió, y de ahí salen dos números:
-- palabras por minuto y fidelidad.
--
-- Se guarda CADA medición, no solo la mejor. El récord se calcula al leer.
-- Guardar el historial completo cuesta unas pocas filas por persona y abre la
-- puerta a ver la curva de mejora con el tiempo, que es lo interesante de
-- verdad: el velocímetro no existe para tener un número alto, existe para que
-- se note el entrenamiento. Si solo guardáramos el máximo, esa curva no se
-- podría dibujar nunca y recuperarla sería imposible.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.dictado_records (
    id             bigserial PRIMARY KEY,
    clerk_user_id  text        NOT NULL,
    ppm            int         NOT NULL,
    palabras       int         NOT NULL,
    segundos       int         NOT NULL,
    -- La fidelidad puede faltar: si el juez del servidor no contestó, la
    -- medición de velocidad igual vale y se guarda sin ella. Un NULL acá
    -- significa "no se pudo medir", nunca "salió cero".
    fidelidad      int,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dictado_records_user_idx
    ON public.dictado_records (clerk_user_id, created_at DESC);

-- RLS encendido y SIN políticas: la tabla es inalcanzable con la llave
-- pública. Todo pasa por las dos funciones de abajo, que corren como dueñas
-- y solo tocan las filas de quien las llama.
ALTER TABLE public.dictado_records ENABLE ROW LEVEL SECURITY;


-- ── GUARDAR UNA MEDICIÓN ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_dictado_record(
    p_clerk_user_id text,
    p_ppm           int,
    p_palabras      int,
    p_segundos      int,
    p_fidelidad     int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mejor int;
    v_n     int;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'sin_usuario');
    END IF;

    -- Guardas de cordura. Un dictado real vive muy dentro de estos bordes;
    -- lo que caiga fuera es un reloj manipulado o un error de cálculo, y en
    -- cualquiera de los dos casos no merece entrar al récord de nadie.
    IF p_segundos IS NULL OR p_segundos < 30 OR p_segundos > 3600 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'tiempo_invalido');
    END IF;
    IF p_ppm IS NULL OR p_ppm < 1 OR p_ppm > 1200 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ppm_invalido');
    END IF;
    IF p_palabras IS NULL OR p_palabras < 1 OR p_palabras > 20000 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'palabras_invalidas');
    END IF;

    INSERT INTO dictado_records
        (clerk_user_id, ppm, palabras, segundos, fidelidad)
    VALUES (
        p_clerk_user_id,
        p_ppm,
        p_palabras,
        p_segundos,
        CASE
            WHEN p_fidelidad IS NULL THEN NULL
            ELSE GREATEST(0, LEAST(100, p_fidelidad))
        END
    );

    SELECT MAX(ppm), COUNT(*) INTO v_mejor, v_n
      FROM dictado_records
     WHERE clerk_user_id = p_clerk_user_id;

    RETURN jsonb_build_object(
        'ok', true,
        'mejor_ppm', v_mejor,
        'intentos', COALESCE(v_n, 0)
    );
END;
$$;


-- ── LEER EL RÉCORD ─────────────────────────────────────────────────────────
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

    -- Las últimas cinco viajan también: son la curva de mejora, que es para
    -- lo que se guarda el historial.
    SELECT COALESCE(jsonb_agg(f ORDER BY f.created_at DESC), '[]'::jsonb)
      INTO v_ult
      FROM (
            SELECT ppm, fidelidad, created_at
              FROM dictado_records
             WHERE clerk_user_id = p_clerk_user_id
             ORDER BY created_at DESC
             LIMIT 5
           ) f;

    RETURN jsonb_build_object(
        'ok', true,
        'mejor_ppm', v_mejor,
        'intentos', COALESCE(v_n, 0),
        'ultimas', v_ult
    );
END;
$$;

REVOKE ALL ON FUNCTION public.save_dictado_record(text, int, int, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dictado_records(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_dictado_record(text, int, int, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dictado_records(text) TO anon, authenticated;
