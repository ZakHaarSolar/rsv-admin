-- Ola C · #8 — canje de cristales solo por usuario verificado.
-- =====================================================================
-- Las 3 RPC tomaban `p_clerk_user_id` (forjable) con GRANT a anon → cualquiera
-- podía quemar los cristales de otro pasando su clerk_user_id (griefing).
-- Ahora solo service_role las ejecuta, y SOLO el edge `user-action` las llama
-- tras verificar el token de Clerk (gateUser → inyecta el id del claim `sub`).
--
-- ⚠️ Aplicar DESPUÉS de que el cliente web (Cristales.tsx v1.7) esté publicado
--    y el edge `user-action` desplegado. La build iOS viva todavía llama estas
--    RPC con la anon key → su canje queda degradado hasta la próxima build
--    (la misma que restaura Decodificador + membresía; ≈0 usuarios hoy).
--
-- Aplicar en: Supabase Dashboard → SQL Editor → New Query → Run.

REVOKE EXECUTE ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_meditacion_with_cristal(text, text)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.canjear_cristal(text, text, text)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_meditacion_with_cristal(text, text)
    TO service_role;
GRANT EXECUTE ON FUNCTION public.canjear_cristal(text, text, text)
    TO service_role;
