-- 20260602b_exclude_veocancun_revenue.sql
-- Excluir la cuenta propia veocancun@gmail.com (Zak´Haar Solar 2) del cómputo
-- de ingresos en Telemetría del Núcleo. Tiene Inmersión Solar con 100% OFF
-- (cobro real 0 MXN) pero la PROYECCIÓN "Por Cobrar" la contaba como 1,999.
--
-- El RPC get_admin_dashboard (v2026-05-20) ya no excluye por is_admin; excluye
-- por la tabla revenue_exclusions. Basta agregar el email ahí: queda fuera de
-- los conteos, la proyección, la lista de suscriptores y el revenue real.

INSERT INTO public.revenue_exclusions (email, reason)
VALUES ('veocancun@gmail.com', 'Cuenta propia de Zak — Inmersión 100% OFF, no es MRR')
ON CONFLICT (email) DO NOTHING;

-- Verificación:
--   SELECT email, reason FROM public.revenue_exclusions ORDER BY created_at;
