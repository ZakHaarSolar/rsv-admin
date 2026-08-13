-- Red Solar Viva · Ola B leftover (paso 3) — LOCK de la tabla scan_vibracional
-- =====================================================================
-- Cierra la lectura+escritura anónima de scan_vibracional. A partir de acá
-- solo service_role (vía el gateway user-action, tras verificar el token)
-- puede tocar la tabla, a través de las RPC save_scan_vibracional /
-- get_my_scan_history.
--
-- ⚠️ Correr SOLO DESPUÉS de que la build iOS nueva (radar migrado a las RPC)
-- esté VIVA en la App Store. La build publicada hoy lee/escribe la tabla
-- directo con la anon key; cerrarla antes rompería el radar en iOS.
-- La web ya queda migrada antes (auto-sync), así que la web no depende de
-- este timing — pero la app sí. Requiere además user-action v1.1 desplegado.
--
-- service_role tiene BYPASSRLS, así que el gateway sigue funcionando con RLS
-- activo y sin policies. Igual REVOCAMOS los grants de tabla a anon/auth para
-- bloquear cualquier camino directo aunque RLS estuviera off.

ALTER TABLE public.scan_vibracional ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.scan_vibracional FROM anon, authenticated;
GRANT ALL ON TABLE public.scan_vibracional TO service_role;
