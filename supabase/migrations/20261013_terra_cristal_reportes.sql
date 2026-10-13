-- 20261013_terra_cristal_reportes.sql
-- Terra Cristal (Ludus Cero, play.redsolarviva.com/terra-cristal-pixel3/): LOS REPORTES DE LOS JUGADORES (Sala 39 de Terra Cristal).
-- En el juego, la R (o REPORTAR en OPCIONES) abre una ventana: quien juega escribe qué pasó (si quiere) y el juego manda el momento exacto
-- (el lugar, la batalla, la ronda, de quién era el turno, el letrero en pantalla), lo esencial de su partida, su bitácora y una foto de la
-- pantalla. Llega por la función terra-cristal-reporte (con la cuenta de Red Solar Viva si hay sesión; sin ella, con el id del aparato) y
-- se lee en el Motor de Intervención → Terra Cristal → Reportes (admin-action v1.62, modos «reportes», «reporte» y «reporte_estado»).
-- La foto vive en R2 (TerraCristal/Reportes/<cuenta o anon>/<id>.png); aquí, su dirección.
-- Solo la escriben y la leen las funciones con service role: RLS activo, sin policies, y sin permisos para anon ni authenticated.
-- Mientras esta tabla no exista, el juego guarda los reportes en el aparato y los manda solo en cuanto exista.
--
-- Pega este archivo en Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS public.terra_cristal_reportes (
    -- el id lo pone el aparato: si un envío llega dos veces, se guarda una
    id            uuid PRIMARY KEY,
    -- cuándo se pulsó la R (lo dice el aparato) y cuándo llegó
    creado        timestamptz NOT NULL,
    recibido      timestamptz NOT NULL DEFAULT now(),
    -- de quién: la cuenta (si jugaba con su sesión) y el aparato (siempre)
    clerk_user_id text,
    aparato       text NOT NULL,
    -- lo que escribió quien juega (puede ir vacío)
    nota          text NOT NULL DEFAULT '',
    -- el momento, para filtrar y contar sin abrir el json
    escena        text,
    lugar         text,
    batalla       text,
    ronda         integer,
    -- el momento entero, lo esencial de la partida y la bitácora del viaje en ese instante
    momento       jsonb NOT NULL DEFAULT '{}'::jsonb,
    partida       jsonb NOT NULL DEFAULT '{}'::jsonb,
    bitacora      jsonb,
    -- con qué: la pantalla del juego, cuándo se compiló el juego, el navegador, el idioma y la zona horaria
    pantalla      jsonb,
    juego         text,
    navegador     text,
    idioma        text,
    zona          text,
    -- la foto de la pantalla (R2)
    foto_url      text,
    -- lo que hace Zak con él en el Motor
    estado        text NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'visto', 'resuelto')),
    estado_en     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tc_reportes_recibido ON public.terra_cristal_reportes (recibido DESC);
CREATE INDEX IF NOT EXISTS idx_tc_reportes_estado ON public.terra_cristal_reportes (estado, recibido DESC);
CREATE INDEX IF NOT EXISTS idx_tc_reportes_cuenta ON public.terra_cristal_reportes (clerk_user_id, recibido DESC);
CREATE INDEX IF NOT EXISTS idx_tc_reportes_aparato ON public.terra_cristal_reportes (aparato, recibido DESC);

ALTER TABLE public.terra_cristal_reportes ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo service role: la función terra-cristal-reporte escribe y admin-action lee.)
REVOKE ALL ON TABLE public.terra_cristal_reportes FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.terra_cristal_reportes IS
'Terra Cristal: los reportes que mandan los jugadores con la R (el momento exacto, su partida, su bitácora y la foto de la pantalla). Los escribe la función terra-cristal-reporte y los lee el Motor por admin-action (admin_terra_cristal, modos reportes, reporte y reporte_estado). Solo service role.';
