-- 20261014_terra_cristal_aparatos.sql
-- Terra Cristal (Ludus Cero, play.redsolarviva.com/terra-cristal-pixel3/): LA BITÁCORA DE CADA APARATO (Sala 40 de Terra Cristal).
-- Se puede jugar sin cuenta, y sin cuenta la partida vive solo en el aparato: el Motor no veía a nadie que jugara así (el primer jugador de
-- Zak, por ejemplo). Desde la Sala 40 el juego manda, cada pocos minutos mientras se juega y al cerrar la pestaña, su partida con la
-- bitácora del viaje a la función terra-cristal-bitacora, que la guarda aquí: UNA fila por aparato (el id al azar que el navegador
-- recuerda, el mismo de los reportes de la R), siempre con lo último. Si quien juega tiene su sesión de Red Solar Viva, la fila queda
-- ligada a su cuenta (y el Motor la usa para ver su bitácora más fresca que su último guardado).
-- Se lee en el Motor de Intervención → Terra Cristal (admin-action v1.63: los jugadores sin cuenta en la lista, su ficha y sus batallas).
-- Solo la escriben y la leen las funciones con service role: RLS activo, sin policies, y sin permisos para anon ni authenticated.
-- Mientras esta tabla no exista, la función contesta 503 y el juego lo vuelve a intentar en el siguiente envío (no se pierde nada: la
-- bitácora sigue en el aparato).
--
-- Pega este archivo en Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS public.terra_cristal_aparatos (
    -- el id del aparato (al azar, lo pone el navegador la primera vez: tcp3.aparato)
    aparato       text PRIMARY KEY CHECK (aparato ~ '^[A-Za-z0-9-]{8,64}$'),
    -- la cuenta de Red Solar Viva, si alguna vez llegó con su sesión (verificada por el token, nunca del cuerpo)
    clerk_user_id text,
    -- la partida del aparato con su bitácora (sin la batalla guardada a medias, que es lo que más pesa)
    documento     jsonb NOT NULL,
    -- el navegador de Zak (o una prueba): se abrió una vez con ?admin=1. El Motor no lo cuenta salvo que se pida
    admin         boolean NOT NULL DEFAULT false,
    -- con qué: cuándo se compiló el juego, el navegador, el idioma y la zona horaria
    juego         text,
    navegador     text,
    idioma        text,
    zona          text,
    -- cuántas veces ha llegado
    envios        integer NOT NULL DEFAULT 1,
    creado        timestamptz NOT NULL DEFAULT now(),
    actualizado   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tc_aparatos_actualizado ON public.terra_cristal_aparatos (actualizado DESC);
CREATE INDEX IF NOT EXISTS idx_tc_aparatos_cuenta ON public.terra_cristal_aparatos (clerk_user_id) WHERE clerk_user_id IS NOT NULL;

ALTER TABLE public.terra_cristal_aparatos ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo service role: la función terra-cristal-bitacora escribe y admin-action lee.)
REVOKE ALL ON TABLE public.terra_cristal_aparatos FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.terra_cristal_aparatos IS
'Terra Cristal: la partida con su bitácora de cada aparato donde se juega (con o sin cuenta), siempre lo último. La escribe la función terra-cristal-bitacora y la lee el Motor por admin-action (admin_terra_cristal: los jugadores sin cuenta, su ficha y sus batallas). Solo service role.';
