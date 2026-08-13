-- 20260806_voz_frases_sin_resolver.sql
-- ════════════════════════════════════════════════════════════════════
-- LAS FRASES QUE LA VOZ NO SUPO RESOLVER
--
-- Idea de Zak (2026-08-06): "los usuarios mismos nos van a dar la llave".
-- Tiene razón, y por eso mismo el diseño es CONSERVADOR: se guarda lo
-- mínimo que sirve para afinar, y nada más.
--
-- 🜂 QUÉ SE GUARDA: SOLO las frases que la interpretación devolvió como
--    UNKNOWN, o sea las que FALLARON. Un acierto no enseña nada que no
--    sepamos ya; el oro está en lo que no entendimos.
-- 🜂 QUÉ NO SE GUARDA:
--    · Nada que la persona pidió y SÍ funcionó (la inmensa mayoría).
--    · La identidad. No hay clerk_user_id, ni correo, ni id de sesión:
--      solo un hash irreversible con sal del servidor, y su único uso es
--      no contar diez veces al mismo que repite la frase. No se puede
--      volver atrás desde el hash a la persona.
--    · Nada del reconocedor LOCAL: eso jamás sale del teléfono. Aquí solo
--      puede caer texto que ya viajó a la nube para interpretarse.
-- 🜂 CUÁNTO VIVE: 90 días. `purgar_voz_frases()` borra lo viejo; se llama
--    desde el mismo cron que ya limpia otras tablas.
--
-- Sirve para una cosa concreta: leer las 20 frases más repetidas que no
-- entendimos y convertirlas en ejemplos del prompt (o en vocabulario del
-- reconocedor local). Ese ciclo es exactamente lo que hemos hecho a mano
-- con las frases de Zak — esto solo lo escala a todos los tripulantes.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.voz_frases_sin_resolver (
    id            bigserial PRIMARY KEY,
    -- La frase tal cual la oyó el reconocedor (recortada). Es lo que se
    -- lee para afinar; sin ella no hay nada que aprender.
    texto         text        NOT NULL,
    lang          text        NOT NULL DEFAULT 'es',
    -- Qué familia detectó el cliente antes de mandarla (racha/plan/…/null).
    familia       text,
    -- El escenario: qué estaba mostrando la app. Dos frases idénticas en
    -- capas distintas son problemas distintos.
    contexto      jsonb       NOT NULL DEFAULT '{}'::jsonb,
    -- Hash irreversible con sal del servidor. Solo para no contar diez
    -- veces al mismo que repite; jamás identifica a nadie.
    quien_hash    text,
    creado_en     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voz_frases_creado_idx
    ON public.voz_frases_sin_resolver (creado_en DESC);

-- RLS activo SIN policies: nadie llega por REST. Solo el service_role de
-- la edge escribe, y las lecturas son por RPC admin (patrón del proyecto).
ALTER TABLE public.voz_frases_sin_resolver ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.voz_frases_sin_resolver FROM PUBLIC, anon, authenticated;

-- ── Lo que se lee para afinar: las frases que MÁS se repiten ──────────
CREATE OR REPLACE FUNCTION public.admin_voz_frases_top(
    p_admin_clerk_id text,
    p_dias           int DEFAULT 14,
    p_limite         int DEFAULT 50
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
        'frases', COALESCE((
            SELECT json_agg(f) FROM (
                SELECT
                    lower(trim(texto))                AS texto,
                    count(*)::int                     AS veces,
                    count(DISTINCT quien_hash)::int   AS personas,
                    max(lang)                         AS lang,
                    max(familia)                      AS familia,
                    max(creado_en)                    AS ultima_vez
                FROM public.voz_frases_sin_resolver
                WHERE creado_en >= now() - make_interval(days => GREATEST(p_dias, 1))
                GROUP BY lower(trim(texto))
                ORDER BY count(DISTINCT quien_hash) DESC, count(*) DESC
                LIMIT LEAST(GREATEST(p_limite, 1), 200)
            ) f
        ), '[]'::json)
    );
END $$;

-- ── Retención: 90 días ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purgar_voz_frases()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_n int;
BEGIN
    DELETE FROM public.voz_frases_sin_resolver
    WHERE creado_en < now() - interval '90 days';
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END $$;

REVOKE ALL ON FUNCTION public.admin_voz_frases_top(text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purgar_voz_frases()                  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_voz_frases_top(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.purgar_voz_frases()                  TO service_role;
