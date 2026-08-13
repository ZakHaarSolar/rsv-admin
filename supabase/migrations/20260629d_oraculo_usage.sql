-- Red Solar Viva · Espejo Vibracional (Oráculo) — contador de cortesía
-- =====================================================================
-- Contador de por-vida de mensajes enviados por usuario, SEPARADO de
-- oraculo_messages. Así "Eliminar conversación" borra el chat SIN resetear
-- los 3 mensajes gratis (si el freemium contara mensajes, borrar la
-- conversación daría 3 nuevos gratis → bypass). RLS-locked: solo service_role
-- (la edge oraculo-chat lo lee/incrementa con su llave de servicio).

CREATE TABLE IF NOT EXISTS public.oraculo_usage (
    clerk_user_id text PRIMARY KEY,
    sent_count    integer     NOT NULL DEFAULT 0,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oraculo_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oraculo_usage FROM anon, authenticated;
GRANT ALL ON public.oraculo_usage TO service_role;

-- Seed: arrancar el contador en el número de mensajes 'user' ya enviados, para
-- no regalar 3 nuevos a quien ya consumió cortesía bajo el esquema anterior.
INSERT INTO public.oraculo_usage (clerk_user_id, sent_count)
SELECT clerk_user_id, COUNT(*)::int
FROM public.oraculo_messages
WHERE role = 'user'
GROUP BY clerk_user_id
ON CONFLICT (clerk_user_id) DO UPDATE
    SET sent_count = GREATEST(public.oraculo_usage.sent_count, EXCLUDED.sent_count);
