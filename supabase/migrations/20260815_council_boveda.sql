-- 20260815_council_boveda.sql
-- ════════════════════════════════════════════════════════════════════
-- 🜂 LA BÓVEDA DEL COUNCIL SOLAR: los outputs viven fuera del navegador
--
-- Zak (2026-08-15 · III): "si recargamos la página, no se pierda todo eso
-- que nos están dando… que se vaya guardando como una base de datos nuestra
-- de outputs". Hasta ahora todo vivía en localStorage del navegador del
-- Arquitecto: sobrevivía a una recarga, no a borrar datos ni a cambiar de
-- Mac. Estas tres tablas son esa base de datos propia:
--
--   council_playbooks       una fila por (Arquitecto, cámara[:nodo]) con la
--                           ÚLTIMA versión del Playbook Vivo (o del Mapa de
--                           Ruta Económica), su ciclo y su última
--                           propuesta/fricción. Se hace UPSERT.
--   council_deliberaciones  bitácora APPEND-ONLY de cada etapa del bucle
--                           autónomo (propuesta / friccion / evolucion): el
--                           historial completo de cómo mutó cada playbook.
--   council_turnos          cada turno del Arquitecto con su respuesta,
--                           idempotente por id de turno (el cliente lo genera).
--
-- Acceso: RLS ENCENDIDO y SIN policies → nadie entra con anon key. Escribe y
-- lee únicamente la edge council-gate (service role) después de verificar
-- el token de Clerk y profiles.is_admin. La columna clerk_user_id separa
-- Arquitectos si algún día hay más de uno.
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → New Query → pegar → Run.
-- Idempotente (IF NOT EXISTS): se puede correr dos veces sin daño.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.council_playbooks (
    clerk_user_id   text        NOT NULL,
    clave           text        NOT NULL,             -- 'zakcero:economia', 'escaner:alfa', 'central'…
    sala            text        NOT NULL,
    nodo            text,
    titulo          text        NOT NULL DEFAULT '',
    contenido       text        NOT NULL DEFAULT '',  -- última EVOLUCIÓN completa (markdown)
    ciclo           integer     NOT NULL DEFAULT 0,
    propuesta       text        NOT NULL DEFAULT '',  -- última propuesta del ciclo
    friccion        text        NOT NULL DEFAULT '',  -- su fricción (con VEREDICTO)
    modelo          text,
    actualizado_ts  bigint      NOT NULL DEFAULT 0,   -- ms del cliente (para fundir por reciente)
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, clave)
);

CREATE TABLE IF NOT EXISTS public.council_deliberaciones (
    id              bigserial   PRIMARY KEY,
    clerk_user_id   text        NOT NULL,
    clave           text        NOT NULL,
    sala            text        NOT NULL,
    nodo            text,
    ciclo           integer     NOT NULL,
    etapa           text        NOT NULL CHECK (etapa IN ('propuesta', 'friccion', 'evolucion')),
    texto           text        NOT NULL,
    modelo          text,
    ts              bigint      NOT NULL DEFAULT 0,   -- ms del cliente
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS council_deliberaciones_clave_idx
    ON public.council_deliberaciones (clerk_user_id, clave, created_at DESC);

CREATE TABLE IF NOT EXISTS public.council_turnos (
    id              text        PRIMARY KEY,           -- id del turno generado por el cliente
    clerk_user_id   text        NOT NULL,
    sala            text        NOT NULL,
    nodo            text,
    pregunta        text        NOT NULL,
    respuesta       text        NOT NULL DEFAULT '',
    interrumpido    boolean     NOT NULL DEFAULT false,
    fallo           text,
    modelo          text,
    ts              bigint      NOT NULL DEFAULT 0,   -- ms del cliente
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS council_turnos_sala_idx
    ON public.council_turnos (clerk_user_id, sala, ts DESC);

-- RLS encendido, sin policies: solo service_role (la edge) entra.
ALTER TABLE public.council_playbooks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_deliberaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_turnos         ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.council_playbooks      FROM anon, authenticated;
REVOKE ALL ON public.council_deliberaciones FROM anon, authenticated;
REVOKE ALL ON public.council_turnos         FROM anon, authenticated;

COMMENT ON TABLE public.council_playbooks      IS 'Council Solar: última versión del Playbook Vivo por cámara/nodo (upsert desde council-gate).';
COMMENT ON TABLE public.council_deliberaciones IS 'Council Solar: bitácora append-only de cada etapa del bucle de deliberación autónoma.';
COMMENT ON TABLE public.council_turnos         IS 'Council Solar: turnos del Arquitecto con la respuesta del núcleo local (idempotente por id).';
