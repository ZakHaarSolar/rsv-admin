-- Red Solar Viva · Campo Solar · los Fotones de Zak y Aqua ya son REALES
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- (Zak, 2026-07-16) Los fundadores ya viven la app de verdad: sus Fotones
-- dejan de excluirse del Campo Solar colectivo. Salen de la lista negra:
--   · cuerpodeluz555@gmail.com  (Zak)
--   · andrea.dl13@gmail.com     (Aqua)
-- Las otras 5 cuentas internas siguen excluidas, igual que la fila sentinela
-- del ajuste admin (activity_key = 'admin_adjust'). Reemplaza la versión de
-- 20260620h_campo_solar_admin.sql (misma firma; solo cambia la lista).

CREATE OR REPLACE FUNCTION public.get_campo_solar()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total        bigint := 0;
    contributors integer := 0;
BEGIN
    SELECT COALESCE(SUM(dc.points), 0), COUNT(DISTINCT dc.clerk_user_id)
    INTO total, contributors
    FROM daily_checkins dc
    LEFT JOIN profiles p ON p.clerk_user_id = dc.clerk_user_id
    WHERE dc.activity_key <> 'admin_adjust'
      AND (
        p.email IS NULL
        OR lower(p.email) NOT IN (
            'beachandsunrisecancun@gmail.com',
            'diegosotoborjaalmeida@gmail.com',
            'redsolarviva@gmail.com',
            'veocancun@gmail.com',
            'veotuluzinterna@gmail.com'
        )
      );

    RETURN json_build_object('total', total, 'contributors', contributors);
END;
$$;

-- Re-afirmar permisos (un CREATE OR REPLACE puede resetear grants).
GRANT EXECUTE ON FUNCTION public.get_campo_solar() TO anon, authenticated;
