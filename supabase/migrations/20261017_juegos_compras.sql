-- 20261017_juegos_compras.sql · Ludus Cero · LA COMPRA DE LOS JUEGOS (Terra Cristal primero, 2026-10-17)
-- =====================================================================
-- Zak: «como es un juego que va a ser de pago, hay ya que empezar a limitar... implementar ya el sistema de cobro con Stripe...
-- eso lo vamos a ir haciendo con cada juego». La versión gratis de Terra Cristal llega hasta la puerta de Lemuria (el Capítulo 1
-- entero); entrar a Lemuria y lo que sigue es el juego completo, pago único. Lo compra una cuenta de Red Solar Viva (la del Escáner).
--
-- La función `juego-compra` (admin/supabase/functions/juego-compra) es la única que lee y escribe estas tablas, con la llave de
-- servicio: nadie las toca desde el navegador (RLS encendido, sin políticas). El id de la cuenta sale del token verificado.
--
--   · juego_compras: quién tiene qué juego completo. Una fila por cuenta y juego; la compra de Stripe, un regalo o el dueño.
--   · juego_checkouts: cada pago que se abrió en Stripe, para cerrarlo aunque quien pagó no haya vuelto al juego (la función
--     revisa los abiertos de los últimos 7 días cuando el juego pregunta).
--
-- Pega este archivo en Supabase Dashboard → SQL Editor → New Query → Run. Se puede correr dos veces sin duplicar nada.

CREATE TABLE IF NOT EXISTS public.juego_compras (
    clerk_user_id          text NOT NULL,
    juego                  text NOT NULL CHECK (juego ~ '^[a-z0-9-]{2,40}$'),
    -- de dónde viene: el pago de Stripe, un regalo del administrador, el dueño o (más adelante) Steam
    origen                 text NOT NULL DEFAULT 'stripe' CHECK (origen IN ('stripe', 'regalo', 'dueno', 'steam')),
    stripe_session_id      text UNIQUE,
    stripe_payment_intent  text,
    monto_centavos         integer,
    moneda                 text,
    email                  text,
    nota                   text,
    creado                 timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, juego)
);
CREATE INDEX IF NOT EXISTS idx_juego_compras_juego ON public.juego_compras (juego, creado DESC);
ALTER TABLE public.juego_compras ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.juego_checkouts (
    stripe_session_id  text PRIMARY KEY,
    clerk_user_id      text NOT NULL,
    juego              text NOT NULL,
    estado             text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'pagado', 'vencido')),
    creado             timestamptz NOT NULL DEFAULT now(),
    actualizado        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_juego_checkouts_cuenta ON public.juego_checkouts (clerk_user_id, juego, creado DESC);
ALTER TABLE public.juego_checkouts ENABLE ROW LEVEL SECURITY;

-- Zak, el dueño: juega siempre el juego completo (para ver el muro: ?muro=1 en la dirección)
INSERT INTO public.juego_compras (clerk_user_id, juego, origen, nota)
VALUES ('user_3BnIRIgc8wLztLL8NGawo3ThhlA', 'terra-cristal', 'dueno', 'Zak')
ON CONFLICT (clerk_user_id, juego) DO NOTHING;
