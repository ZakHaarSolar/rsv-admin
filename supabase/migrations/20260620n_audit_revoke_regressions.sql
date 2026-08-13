-- Red Solar Viva · AUDITORÍA 2026-06-20 · Cierre de REGRESIONES de permisos
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- CONTEXTO: la auditoría halló 3 funciones que una auditoría previa ya había
-- cerrado (REVOKE anon) pero que una migración POSTERIOR volvió a abrir con un
-- `GRANT ... TO anon` al final (CREATE OR REPLACE conserva permisos, pero un
-- GRANT posterior los re-agrega). Todas se llaman SOLO por los gateways
-- verificados (user-action / admin-action) → revocar anon NO rompe ningún
-- cliente. Cero riesgo.
--
--   1) CRÍTICO — get_my_dream_records: re-abierta por 20260616_dream_custom_title
--      (línea 75). SECURITY DEFINER que confía en un target_clerk_id del body →
--      anon + un clerk_user_id conocido = TEXTO COMPLETO de los sueños + dictamen
--      de cualquier Tripulante. Es exactamente la fuga de sueños privados.
--   2) ALTO — rename_my_dream_record: re-abierta por la misma migración (44).
--      Permite a anon sobrescribir el título del sueño de otro (griefing/escritura).
--   3) BAJO — get_zakhaar_carousels_admin: re-abierta por 20260615_zakhaar_
--      carousel_cover (78). Contenida por su propio check is_admin interno (no
--      filtra datos), pero es un REVOKE deshecho → se re-cierra por consistencia.
--
-- REGLA NUEVA (para evitar repetir esto): tras un CREATE OR REPLACE de una
-- función DEFINER que debía quedar gateway-only, re-afirmar el REVOKE al final
-- de ESA migración. Nunca re-correr el `GRANT ... TO anon` original.

-- 1) CRÍTICO — fuga de sueños privados.
REVOKE EXECUTE ON FUNCTION public.get_my_dream_records(TEXT, INT)        FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_dream_records(TEXT, INT)        TO service_role;

-- 2) ALTO — tampering de títulos de sueños ajenos.
REVOKE EXECUTE ON FUNCTION public.rename_my_dream_record(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.rename_my_dream_record(TEXT, UUID, TEXT) TO service_role;

-- 3) BAJO — REVOKE de admin deshecho (contenido por el gate interno, igual se cierra).
REVOKE EXECUTE ON FUNCTION public.get_zakhaar_carousels_admin(text, text, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_zakhaar_carousels_admin(text, text, int) TO service_role;

-- Refresca el cache de esquema de PostgREST para que el REVOKE tome efecto ya.
NOTIFY pgrst, 'reload schema';
