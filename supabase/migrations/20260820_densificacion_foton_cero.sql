-- 20260820_densificacion_foton_cero.sql — 🜂 EL PANEL DE DENSIFICACIÓN de Fotón Cero
-- ============================================================================
-- DOS COSAS EN UNA (las dos del mismo dominio: que la producción sobreviva):
--
-- 1) EL ARREGLO URGENTE. council_guardar_registros filtraba
--    tipo IN ('cofre','ley','bitacora','posicion'): la migración 20260817
--    amplió la CHECK de la tabla con los seis tipos de producción
--    (sello/serie/personaje/episodio/album/cancion) pero NUNCA el WHERE de la
--    función. Resultado: todos los documentos de la Producción de Fotón Cero
--    se descartaban EN SILENCIO (la función devolvía un conteo menor sin
--    error, la edge lo tomaba como éxito y el cliente vaciaba su cola). La
--    Producción entera vivía solo en el localStorage del navegador. Aquí la
--    función gana los diez tipos y, para los de producción, el tope real de
--    60.000 caracteres (el que la edge ya anunciaba) en vez del corte a 8.000.
--
-- 2) EL PANEL DE DENSIFICACIÓN: tres tablas para el motor de producción de
--    series (entidades con láminas visuales, actos y tomas del storyboard) y
--    su función de guardado condicional. Las series NO tienen tabla: viven en
--    la Producción de la casa y aquí se referencian por id.
--
-- Patrón de la bóveda del Council: RLS encendido SIN policies (nadie entra
-- por REST con anon key; todo pasa por la edge council-gate con service role
-- tras gateAdmin), separación por Arquitecto en la columna clerk_user_id, y
-- borrado con LÁPIDA (borrado_ts): un borrado que no viaja no es un borrado.
-- La fusión del cliente respeta la lápida más nueva.
-- Idempotente: se pega en Supabase → SQL Editor → New Query → Run.
-- ============================================================================

-- ── 1) La función de registros aprende los diez tipos ──────────────────────

CREATE OR REPLACE FUNCTION public.council_guardar_registros(p_user text, p_items jsonb)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH candidatos AS (
        SELECT DISTINCT ON (tipo, clave)
            tipo,
            left(coalesce(clave, ''), 120) AS clave,
            left(
                coalesce(contenido, ''),
                CASE WHEN tipo IN ('sello', 'serie', 'personaje', 'episodio', 'album', 'cancion')
                     THEN 60000 ELSE 8000 END
            ) AS contenido,
            coalesce(ts, 0) AS ts
        FROM jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
            AS x(tipo text, clave text, contenido text, ts bigint)
        WHERE tipo IN ('cofre', 'ley', 'bitacora', 'posicion',
                       'sello', 'serie', 'personaje', 'episodio', 'album', 'cancion')
          AND coalesce(clave, '') <> ''
          AND length(coalesce(clave, '')) <= 120
          AND coalesce(p_user, '') <> ''
        ORDER BY tipo, clave, coalesce(ts, 0) DESC
    ),
    escritos AS (
        INSERT INTO public.council_registros AS r
            (clerk_user_id, tipo, clave, contenido, actualizado_ts, updated_at)
        SELECT p_user, tipo, clave, contenido, ts, now()
        FROM candidatos
        ON CONFLICT (clerk_user_id, tipo, clave) DO UPDATE
            SET contenido = excluded.contenido,
                actualizado_ts = excluded.actualizado_ts,
                updated_at = now()
            WHERE excluded.actualizado_ts > r.actualizado_ts
        RETURNING 1
    )
    SELECT coalesce(count(*), 0)::integer FROM escritos;
$$;

REVOKE ALL ON FUNCTION public.council_guardar_registros(text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.council_guardar_registros(text, jsonb) TO service_role;

-- ── 2) Las tres tablas del Panel de Densificación ──────────────────────────

CREATE TABLE IF NOT EXISTS public.council_densi_entidades (
    clerk_user_id   text        NOT NULL,
    id              text        NOT NULL,
    serie_id        text        NOT NULL,
    -- personaje | locacion | universo | estilo | prop
    tipo            text        NOT NULL DEFAULT 'personaje',
    nombre          text        NOT NULL DEFAULT '',
    orden           integer     NOT NULL DEFAULT 0,
    -- resumen, esencia, cuerpo, vestuario, voz, notas, personajeId,
    -- laminas [{id,titulo,url,miniUrl,prompt,ts}]
    datos           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    actualizado_ts  bigint      NOT NULL DEFAULT 0,
    borrado_ts      bigint,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, id)
);

CREATE TABLE IF NOT EXISTS public.council_densi_actos (
    clerk_user_id   text        NOT NULL,
    id              text        NOT NULL,
    serie_id        text        NOT NULL,
    episodio_id     text        NOT NULL DEFAULT '',
    titulo          text        NOT NULL DEFAULT '',
    orden           integer     NOT NULL DEFAULT 0,
    -- proposito, notas
    datos           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    actualizado_ts  bigint      NOT NULL DEFAULT 0,
    borrado_ts      bigint,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, id)
);

CREATE TABLE IF NOT EXISTS public.council_densi_tomas (
    clerk_user_id   text        NOT NULL,
    id              text        NOT NULL,
    serie_id        text        NOT NULL,
    acto_id         text        NOT NULL,
    orden           integer     NOT NULL DEFAULT 0,
    -- narrativa, dialogo, entidades[], locacionId, encuadre, camara, luz,
    -- duracionSeg, promptImagen, promptMovimiento, imagenUrl, miniUrl,
    -- estado (boceto|prompt|imagen|animada), notas
    datos           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    actualizado_ts  bigint      NOT NULL DEFAULT 0,
    borrado_ts      bigint,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, id)
);

CREATE INDEX IF NOT EXISTS council_densi_entidades_serie_idx
    ON public.council_densi_entidades (clerk_user_id, serie_id);
CREATE INDEX IF NOT EXISTS council_densi_actos_serie_idx
    ON public.council_densi_actos (clerk_user_id, serie_id, episodio_id);
CREATE INDEX IF NOT EXISTS council_densi_tomas_serie_idx
    ON public.council_densi_tomas (clerk_user_id, serie_id);
CREATE INDEX IF NOT EXISTS council_densi_tomas_acto_idx
    ON public.council_densi_tomas (clerk_user_id, acto_id);

ALTER TABLE public.council_densi_entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_densi_actos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_densi_tomas     ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.council_densi_entidades FROM anon, authenticated;
REVOKE ALL ON public.council_densi_actos     FROM anon, authenticated;
REVOKE ALL ON public.council_densi_tomas     FROM anon, authenticated;

-- ── 3) El guardado condicional de la densificación ─────────────────────────
-- Un solo viaje con los tres lotes. Cada fila gana solo si es más nueva
-- (multi-computadora sin pisarse); la lápida viaja como una escritura más.

CREATE OR REPLACE FUNCTION public.council_densi_guardar(
    p_user text, p_entidades jsonb, p_actos jsonb, p_tomas jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH ent AS (
        SELECT DISTINCT ON (id)
            left(coalesce(id, ''), 64) AS id,
            left(coalesce(serie_id, ''), 64) AS serie_id,
            coalesce(tipo, 'personaje') AS tipo,
            left(coalesce(nombre, ''), 200) AS nombre,
            coalesce(orden, 0) AS orden,
            coalesce(datos, '{}'::jsonb) AS datos,
            coalesce(ts, 0) AS ts,
            borrado
        FROM jsonb_to_recordset(coalesce(p_entidades, '[]'::jsonb))
            AS x(id text, serie_id text, tipo text, nombre text, orden integer,
                 datos jsonb, ts bigint, borrado bigint)
        WHERE coalesce(id, '') <> '' AND coalesce(serie_id, '') <> ''
          AND coalesce(p_user, '') <> ''
          AND tipo IN ('personaje', 'locacion', 'universo', 'estilo', 'prop')
        ORDER BY id, coalesce(ts, 0) DESC
    ),
    ent_w AS (
        INSERT INTO public.council_densi_entidades AS e
            (clerk_user_id, id, serie_id, tipo, nombre, orden, datos,
             actualizado_ts, borrado_ts, updated_at)
        SELECT p_user, id, serie_id, tipo, nombre, orden, datos, ts, borrado, now()
        FROM ent
        ON CONFLICT (clerk_user_id, id) DO UPDATE
            SET serie_id = excluded.serie_id,
                tipo = excluded.tipo,
                nombre = excluded.nombre,
                orden = excluded.orden,
                datos = excluded.datos,
                actualizado_ts = excluded.actualizado_ts,
                borrado_ts = excluded.borrado_ts,
                updated_at = now()
            WHERE excluded.actualizado_ts > e.actualizado_ts
        RETURNING 1
    ),
    act AS (
        SELECT DISTINCT ON (id)
            left(coalesce(id, ''), 64) AS id,
            left(coalesce(serie_id, ''), 64) AS serie_id,
            left(coalesce(episodio_id, ''), 64) AS episodio_id,
            left(coalesce(titulo, ''), 200) AS titulo,
            coalesce(orden, 0) AS orden,
            coalesce(datos, '{}'::jsonb) AS datos,
            coalesce(ts, 0) AS ts,
            borrado
        FROM jsonb_to_recordset(coalesce(p_actos, '[]'::jsonb))
            AS x(id text, serie_id text, episodio_id text, titulo text,
                 orden integer, datos jsonb, ts bigint, borrado bigint)
        WHERE coalesce(id, '') <> '' AND coalesce(serie_id, '') <> ''
          AND coalesce(p_user, '') <> ''
        ORDER BY id, coalesce(ts, 0) DESC
    ),
    act_w AS (
        INSERT INTO public.council_densi_actos AS a
            (clerk_user_id, id, serie_id, episodio_id, titulo, orden, datos,
             actualizado_ts, borrado_ts, updated_at)
        SELECT p_user, id, serie_id, episodio_id, titulo, orden, datos, ts, borrado, now()
        FROM act
        ON CONFLICT (clerk_user_id, id) DO UPDATE
            SET serie_id = excluded.serie_id,
                episodio_id = excluded.episodio_id,
                titulo = excluded.titulo,
                orden = excluded.orden,
                datos = excluded.datos,
                actualizado_ts = excluded.actualizado_ts,
                borrado_ts = excluded.borrado_ts,
                updated_at = now()
            WHERE excluded.actualizado_ts > a.actualizado_ts
        RETURNING 1
    ),
    tom AS (
        SELECT DISTINCT ON (id)
            left(coalesce(id, ''), 64) AS id,
            left(coalesce(serie_id, ''), 64) AS serie_id,
            left(coalesce(acto_id, ''), 64) AS acto_id,
            coalesce(orden, 0) AS orden,
            coalesce(datos, '{}'::jsonb) AS datos,
            coalesce(ts, 0) AS ts,
            borrado
        FROM jsonb_to_recordset(coalesce(p_tomas, '[]'::jsonb))
            AS x(id text, serie_id text, acto_id text, orden integer,
                 datos jsonb, ts bigint, borrado bigint)
        WHERE coalesce(id, '') <> '' AND coalesce(serie_id, '') <> ''
          AND coalesce(acto_id, '') <> ''
          AND coalesce(p_user, '') <> ''
        ORDER BY id, coalesce(ts, 0) DESC
    ),
    tom_w AS (
        INSERT INTO public.council_densi_tomas AS t
            (clerk_user_id, id, serie_id, acto_id, orden, datos,
             actualizado_ts, borrado_ts, updated_at)
        SELECT p_user, id, serie_id, acto_id, orden, datos, ts, borrado, now()
        FROM tom
        ON CONFLICT (clerk_user_id, id) DO UPDATE
            SET serie_id = excluded.serie_id,
                acto_id = excluded.acto_id,
                orden = excluded.orden,
                datos = excluded.datos,
                actualizado_ts = excluded.actualizado_ts,
                borrado_ts = excluded.borrado_ts,
                updated_at = now()
            WHERE excluded.actualizado_ts > t.actualizado_ts
        RETURNING 1
    )
    SELECT jsonb_build_object(
        'entidades', (SELECT coalesce(count(*), 0) FROM ent_w),
        'actos',     (SELECT coalesce(count(*), 0) FROM act_w),
        'tomas',     (SELECT coalesce(count(*), 0) FROM tom_w)
    );
$$;

REVOKE ALL ON FUNCTION public.council_densi_guardar(text, jsonb, jsonb, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.council_densi_guardar(text, jsonb, jsonb, jsonb) TO service_role;
