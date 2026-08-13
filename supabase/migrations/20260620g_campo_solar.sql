-- Red Solar Viva · Campo Solar Colectivo
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- "Campo Solar": TODOS los Fotones de todos los Tripulantes suman a un medidor
-- planetario compartido — la comunidad eleva la vibración junta (pertenencia +
-- propósito). RPC pública (solo agregados, CERO PII): total de Fotones de la Red
-- + cuántos Tripulantes están contribuyendo. Excluye la fila sentinela del
-- ajuste admin de prueba (activity_key='admin_adjust') para no inflar el campo.

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
    SELECT COALESCE(SUM(points), 0), COUNT(DISTINCT clerk_user_id)
    INTO total, contributors
    FROM daily_checkins
    WHERE activity_key <> 'admin_adjust';

    RETURN json_build_object(
        'total', total,
        'contributors', contributors
    );
END;
$$;

-- Pública: la llama el cliente directo con la anon key (agregado, sin PII).
GRANT EXECUTE ON FUNCTION public.get_campo_solar() TO anon, authenticated;
