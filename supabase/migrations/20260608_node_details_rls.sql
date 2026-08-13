-- Ola C · #4 — node_details: lectura pública, escritura solo admin.
-- =====================================================================
-- La tabla estaba UNRESTRICTED: con la anon key se podía LEER y ESCRIBIR.
-- El hub usa la lectura pública para pintar sus tarjetas (Simuladores, etc.),
-- así que la lectura se MANTIENE abierta. La escritura se cierra para
-- anon/authenticated y pasa a ir por el edge `admin-node-upsert`
-- (service_role, tras verificar el token de Clerk del admin).
-- service_role tiene BYPASSRLS → el edge sigue pudiendo escribir.
--
-- Aplicar en: Supabase Dashboard → SQL Editor → New Query → Run.

ALTER TABLE public.node_details ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el hub la necesita para pintar las tarjetas).
DROP POLICY IF EXISTS node_details_public_read ON public.node_details;
CREATE POLICY node_details_public_read
    ON public.node_details
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Cierra la escritura anónima/autenticada. El GRANT por defecto puede venir
-- de PUBLIC, así que se revoca de ahí también. service_role conserva (o se le
-- re-otorga) la escritura para el edge.
REVOKE INSERT, UPDATE, DELETE ON public.node_details FROM PUBLIC, anon, authenticated;
GRANT  INSERT, UPDATE, DELETE ON public.node_details TO service_role;

-- (SELECT NO se revoca: anon/authenticated siguen leyendo vía la policy.)
