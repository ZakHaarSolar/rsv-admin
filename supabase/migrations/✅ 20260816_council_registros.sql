-- 20260816_council_registros.sql
-- ════════════════════════════════════════════════════════════════════
-- 🜂 LOS REGISTROS DEL ARQUITECTO VIVEN FUERA DEL NAVEGADOR
--
-- Zak (2026-08-16 · VI): "entrar a /council desde CUALQUIER computadora con
-- mi misma cuenta y encontrar exactamente el mismo estado". Hasta ahora el
-- pergamino (oro y plata), el bote, el cofre, el arsenal, el ábaco, las
-- posiciones de las reliquias, las leyes y el registro de cada nodo vivían
-- SOLO en localStorage (`rsv-council-v1`): sobrevivían a recargar y a apagar
-- la Mac, no a borrar los datos del sitio ni a cambiar de computadora.
--
-- Dos tablas, porque son dos naturalezas distintas:
--
--   council_registros   DOCUMENTOS por llave. Texto libre que se reescribe
--                       entero: el cofre, el arsenal, la ley de un nodo, su
--                       registro, y dónde quedó cada reliquia. Gana el más
--                       reciente por DOCUMENTO (actualizado_ts).
--
--   council_entradas    ENTRADAS independientes, una fila cada una: los
--                       juicios del pergamino y del bote (por nodo) y las
--                       tareas del ábaco. Aquí un documento único NO sirve:
--                       aprobar algo en una Mac pisaría lo aprobado en la
--                       otra. Cada entrada gana o pierde sola, y BORRAR es
--                       una LÁPIDA (`borrada = true`), no un hueco: sin ella
--                       la otra máquina resucita lo tirado al sincronizar.
--
-- Escritura CONDICIONAL: las dos funciones de abajo hacen ON CONFLICT DO
-- UPDATE ... WHERE excluded.actualizado_ts > <tabla>.actualizado_ts. O sea,
-- una escritura vieja que llega tarde (dos Macs a la vez, red lenta) NO pisa
-- una nueva. Un upsert normal sí lo haría, y ese es justamente el caso que
-- Zak quiere resuelto.
--
-- Acceso: RLS ENCENDIDO y SIN policies → nadie entra con anon key. Escribe y
-- lee únicamente la edge council-gate (service role) tras verificar el token
-- de Clerk y profiles.is_admin. Mismo patrón que 20260815_council_boveda.sql.
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → New Query → pegar → Run.
-- Idempotente: se puede correr dos veces sin daño.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.council_registros (
    clerk_user_id   text        NOT NULL,
    -- 'cofre' (cofre|arsenal) · 'ley' · 'bitacora' (por clave de playbook)
    -- · 'posicion' (por reliquia: boveda|bote|cofre|arsenal|abaco)
    tipo            text        NOT NULL,
    clave           text        NOT NULL,
    -- texto tal cual lo escribió el Arquitecto; en 'posicion' es el JSON [x,y,z]
    contenido       text        NOT NULL DEFAULT '',
    actualizado_ts  bigint      NOT NULL DEFAULT 0,   -- ms del cliente: decide quién gana
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, tipo, clave),
    CONSTRAINT council_registros_tipo_chk
        CHECK (tipo IN ('cofre', 'ley', 'bitacora', 'posicion'))
);

CREATE TABLE IF NOT EXISTS public.council_entradas (
    clerk_user_id   text        NOT NULL,
    tipo            text        NOT NULL,             -- 'juicio' | 'tarea'
    id              text        NOT NULL,             -- id de la entrada (lo genera el cliente)
    -- clave del playbook dueño (juicios); vacío en las tareas, que son de la casa
    clave           text        NOT NULL DEFAULT '',
    -- el objeto completo tal cual lo usa la app (texto, vale, nivel, ts…).
    -- jsonb a propósito: la forma de un juicio o de una tarea todavía crece,
    -- y una columna por campo obligaría a una migración por cada campo nuevo.
    datos           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    borrada         boolean     NOT NULL DEFAULT false,  -- 🜂 la lápida
    actualizado_ts  bigint      NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, tipo, id),
    CONSTRAINT council_entradas_tipo_chk
        CHECK (tipo IN ('juicio', 'tarea'))
);
CREATE INDEX IF NOT EXISTS council_entradas_clave_idx
    ON public.council_entradas (clerk_user_id, tipo, clave);

-- ── Escritura condicional: lo viejo nunca pisa lo nuevo ──────────────

CREATE OR REPLACE FUNCTION public.council_guardar_registros(p_user text, p_items jsonb)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH crudo AS (
        SELECT *
        FROM jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
            AS x(tipo text, clave text, contenido text, ts bigint)
    ), limpio AS (
        -- DISTINCT ON: dos veces la misma llave en un mismo lote haría
        -- estallar el ON CONFLICT ("cannot affect row a second time")
        SELECT DISTINCT ON (tipo, clave)
            tipo,
            clave,
            left(coalesce(contenido, ''), 8000) AS contenido,
            coalesce(ts, 0) AS ts
        FROM crudo
        WHERE tipo IN ('cofre', 'ley', 'bitacora', 'posicion')
          AND coalesce(clave, '') <> ''
          AND length(clave) <= 120
          AND coalesce(p_user, '') <> ''
        ORDER BY tipo, clave, coalesce(ts, 0) DESC
    ), guardado AS (
        INSERT INTO public.council_registros AS r
            (clerk_user_id, tipo, clave, contenido, actualizado_ts, updated_at)
        SELECT p_user, tipo, clave, contenido, ts, now() FROM limpio
        ON CONFLICT (clerk_user_id, tipo, clave) DO UPDATE
            SET contenido      = excluded.contenido,
                actualizado_ts = excluded.actualizado_ts,
                updated_at     = now()
            WHERE excluded.actualizado_ts > r.actualizado_ts
        RETURNING 1
    )
    SELECT coalesce(count(*), 0)::integer FROM guardado;
$$;

CREATE OR REPLACE FUNCTION public.council_guardar_entradas(p_user text, p_items jsonb)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH crudo AS (
        SELECT *
        FROM jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
            AS x(tipo text, id text, clave text, datos jsonb, borrada boolean, ts bigint)
    ), limpio AS (
        SELECT DISTINCT ON (tipo, id)
            tipo,
            id,
            left(coalesce(clave, ''), 120) AS clave,
            coalesce(datos, '{}'::jsonb) AS datos,
            coalesce(borrada, false) AS borrada,
            coalesce(ts, 0) AS ts
        FROM crudo
        WHERE tipo IN ('juicio', 'tarea')
          AND coalesce(id, '') <> ''
          AND length(id) <= 64
          AND coalesce(p_user, '') <> ''
        ORDER BY tipo, id, coalesce(ts, 0) DESC
    ), guardado AS (
        INSERT INTO public.council_entradas AS e
            (clerk_user_id, tipo, id, clave, datos, borrada, actualizado_ts, updated_at)
        SELECT p_user, tipo, id, clave, datos, borrada, ts, now() FROM limpio
        ON CONFLICT (clerk_user_id, tipo, id) DO UPDATE
            SET clave          = excluded.clave,
                datos          = excluded.datos,
                borrada        = excluded.borrada,
                actualizado_ts = excluded.actualizado_ts,
                updated_at     = now()
            WHERE excluded.actualizado_ts > e.actualizado_ts
        RETURNING 1
    )
    SELECT coalesce(count(*), 0)::integer FROM guardado;
$$;

-- RLS encendido, sin policies: solo service_role (la edge) entra.
ALTER TABLE public.council_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_entradas  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.council_registros FROM anon, authenticated;
REVOKE ALL ON public.council_entradas  FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.council_guardar_registros(text, jsonb) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.council_guardar_entradas(text, jsonb)  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.council_guardar_registros(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.council_guardar_entradas(text, jsonb)  TO service_role;

COMMENT ON TABLE public.council_registros IS
    'Council Solar: documentos del Arquitecto por llave (cofre, arsenal, leyes, bitácora y posiciones de las reliquias). Gana el más reciente por documento.';
COMMENT ON TABLE public.council_entradas IS
    'Council Solar: entradas independientes del Arquitecto (juicios del pergamino/bote y tareas del ábaco), con lápida al borrar para que otra máquina no las resucite.';
