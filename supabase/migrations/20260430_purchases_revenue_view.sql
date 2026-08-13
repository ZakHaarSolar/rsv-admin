-- 20260430_purchases_revenue_view.sql
-- Vista helper para que cualquier RPC de revenue / telemetría
-- automáticamente excluya las filas con acquired_via='cristal'.
-- Las suscripciones que pagan con cristal NO son ingreso real.
--
-- Si tu RPC de revenue (`get_revenue_history`, `get_admin_summary`,
-- etc.) lee de `public.purchases`, podés:
--   a) Cambiar `FROM public.purchases` por `FROM public.purchases_revenue`,
--   b) o agregar `WHERE acquired_via = 'pago'` al WHERE existente.
--
-- Esta vista NO altera comportamientos previos: si no se usa, todo
-- sigue igual. Es solo una herramienta a disposición.

CREATE OR REPLACE VIEW public.purchases_revenue AS
SELECT *
FROM public.purchases
WHERE acquired_via = 'pago';

GRANT SELECT ON public.purchases_revenue
    TO anon, authenticated, service_role;

COMMENT ON VIEW public.purchases_revenue IS
'Vista de purchases filtrada al subset que SÍ generó ingreso real (excluye canjes con Cristal de Extracción). Úsala en cualquier query/RPC de revenue / telemetría para que los cristales no inflen los ingresos. Las filas con acquired_via=''cristal'' siguen disponibles en la tabla base public.purchases para mostrar "Mis Códices" del Tripulante.';
