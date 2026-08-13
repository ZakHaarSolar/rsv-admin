-- 20260813b_espejo_afinamiento.sql
-- ════════════════════════════════════════════════════════════════════
-- EL AFINAMIENTO DE LA MATRIZ — cuando un reflejo no representa la visión
--
-- Zak (2026-08-13): la Matriz aconsejó desde un paradigma viejo, él lo
-- corrigió a mano en la conversación, y esa corrección —que es EXACTAMENTE
-- el material del que salen las leyes del prompt— se habría perdido en el
-- hilo si no me la hubiera contado. Contármela cada vez cuesta una sala
-- entera y pierde el juicio en el momento en que existe.
--
-- Esto es el mismo bucle que ya funciona en el panel de Voz
-- (voz_frases_sin_resolver → Motor → "Voz" → ejemplos del prompt), aplicado
-- al Espejo: la app captura el par (lo que dijo · lo que debía decir), Zak
-- lo lee en el Motor, y de ahí sale la ley.
--
-- 🜂 QUÉ SE GUARDA: solo lo que alguien marcó como fuera de visión. Un
--    reflejo que gustó no enseña nada que no sepamos; el oro está en el
--    desvío. Se guarda el reflejo (recortado), lo que lo provocó, el ángulo
--    correcto si lo escribieron, y el carril (matriz/espejo) porque son dos
--    modos con leyes distintas y mezclarlos sería inútil.
-- 🜂 QUÉ NO SE GUARDA: nada de identidad más allá del clerk_user_id, que
--    hace falta para dos cosas honestas: que cada quien vea y borre lo suyo,
--    y que el panel sepa si cinco marcas son de cinco personas o de una
--    insistiendo. El panel del Motor lo lee SIN correo ni nombre.
-- 🜂 CUÁNTO VIVE: 180 días. Más que la voz (90) porque una ley de
--    pensamiento se cocina más lento que un sinónimo de comando.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.espejo_afinamiento (
    id             bigserial PRIMARY KEY,
    clerk_user_id  text        NOT NULL,
    -- "matriz" (Matriz Sincrónica / carril efímero) o "espejo" (modo origen).
    carril         text        NOT NULL DEFAULT 'matriz',
    -- Lo que la persona escribió y lo que el Espejo contestó, recortados.
    prompt         text,
    reflejo        text        NOT NULL,
    -- 🜂 EL CORAZÓN: el ángulo correcto, en las palabras de quien corrige.
    -- Opcional a propósito: exigirlo convertiría un gesto de dos segundos en
    -- una tarea, y la mitad de las marcas no se harían.
    angulo         text,
    lang           text        NOT NULL DEFAULT 'es',
    -- Estado del bucle: nueva → aplicada (ya es ley del prompt) o
    -- descartada (se revisó y no procedía).
    estado         text        NOT NULL DEFAULT 'nueva',
    creado_en      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS espejo_afinamiento_creado_idx
    ON public.espejo_afinamiento (creado_en DESC);
CREATE INDEX IF NOT EXISTS espejo_afinamiento_estado_idx
    ON public.espejo_afinamiento (estado, creado_en DESC);

-- RLS activo SIN policies: nadie llega por REST. Solo el service_role de las
-- edges escribe, y las lecturas van por RPC admin (patrón del proyecto).
ALTER TABLE public.espejo_afinamiento ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.espejo_afinamiento FROM PUBLIC, anon, authenticated;

-- ── ESCRIBIR: la marca que deja el Tripulante ────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_afinamiento_espejo(
    p_clerk_user_id text,
    p_carril        text,
    p_prompt        text,
    p_reflejo       text,
    p_angulo        text,
    p_lang          text DEFAULT 'es'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id bigint;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'sin_sesion');
    END IF;
    IF p_reflejo IS NULL OR length(trim(p_reflejo)) < 10 THEN
        RETURN json_build_object('error', 'sin_reflejo');
    END IF;

    INSERT INTO public.espejo_afinamiento
        (clerk_user_id, carril, prompt, reflejo, angulo, lang)
    VALUES (
        p_clerk_user_id,
        CASE WHEN p_carril = 'espejo' THEN 'espejo' ELSE 'matriz' END,
        left(COALESCE(p_prompt, ''), 4000),
        left(p_reflejo, 12000),
        NULLIF(left(COALESCE(p_angulo, ''), 4000), ''),
        COALESCE(NULLIF(left(p_lang, 2), ''), 'es')
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('ok', true, 'id', v_id);
END;
$$;

-- ── LEER: el panel del Motor, sin identidad ──────────────────────────
CREATE OR REPLACE FUNCTION public.admin_espejo_afinamiento(
    p_admin_clerk_id text,
    p_dias           int DEFAULT 30,
    p_estado         text DEFAULT 'nueva',
    p_limite         int DEFAULT 100
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RETURN json_build_object('error', 'forbidden');
    END IF;

    RETURN json_build_object(
        'ok', true,
        'desde', (now() - make_interval(days => GREATEST(p_dias, 1)))::date,
        'pendientes', (
            SELECT count(*)::int FROM public.espejo_afinamiento
            WHERE estado = 'nueva'
        ),
        'marcas', COALESCE((
            SELECT json_agg(f) FROM (
                SELECT
                    id,
                    carril,
                    prompt,
                    reflejo,
                    angulo,
                    lang,
                    estado,
                    creado_en,
                    -- Sin identidad: solo si varias personas distintas
                    -- marcaron. El hash corto agrupa sin identificar.
                    substr(md5(clerk_user_id), 1, 8) AS quien
                FROM public.espejo_afinamiento
                WHERE creado_en >= now() - make_interval(days => GREATEST(p_dias, 1))
                  AND (p_estado = 'todas' OR estado = p_estado)
                ORDER BY creado_en DESC
                LIMIT LEAST(GREATEST(p_limite, 1), 300)
            ) f
        ), '[]'::json)
    );
END;
$$;

-- ── MARCAR: aplicada (ya es ley) o descartada ────────────────────────
CREATE OR REPLACE FUNCTION public.admin_espejo_afinamiento_estado(
    p_admin_clerk_id text,
    p_ids            bigint[],
    p_estado         text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin boolean;
    v_n     int;
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RETURN json_build_object('error', 'forbidden');
    END IF;
    IF p_estado NOT IN ('nueva', 'aplicada', 'descartada') THEN
        RETURN json_build_object('error', 'estado_invalido');
    END IF;
    IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
        RETURN json_build_object('error', 'sin_ids');
    END IF;

    UPDATE public.espejo_afinamiento
       SET estado = p_estado
     WHERE id = ANY (p_ids);
    GET DIAGNOSTICS v_n = ROW_COUNT;

    RETURN json_build_object('ok', true, 'actualizadas', v_n);
END;
$$;

-- ── PURGA: 180 días ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purgar_espejo_afinamiento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.espejo_afinamiento
    WHERE creado_en < now() - interval '180 days';
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_afinamiento_espejo(text, text, text, text, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_afinamiento_espejo(text, text, text, text, text, text)
    TO service_role;

REVOKE ALL ON FUNCTION public.admin_espejo_afinamiento(text, int, text, int)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_espejo_afinamiento(text, int, text, int)
    TO service_role;

REVOKE ALL ON FUNCTION public.admin_espejo_afinamiento_estado(text, bigint[], text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_espejo_afinamiento_estado(text, bigint[], text)
    TO service_role;

REVOKE ALL ON FUNCTION public.purgar_espejo_afinamiento()
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_espejo_afinamiento() TO service_role;
