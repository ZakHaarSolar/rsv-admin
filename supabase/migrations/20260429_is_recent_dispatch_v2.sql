-- Red Solar Viva · is_recent_dispatch v2
-- =====================================================================
-- Mismo nombre y firma. Cambia la lógica interna: ahora cuenta también
-- los registros con status 'queued' o 'post_send_error', no solo 'sent'.
--
-- Por qué: BienvenidaNodo v3 (2026-04-29) agregó pre-registro
-- "queued" antes del sendMail para que retries de Svix/Clerk
-- atrapen el caso "el email se envió pero el workflow crasheó después
-- y devolvió 400" (caso edmundospina@gmail.com 2026-04-27/28: 8
-- retries del mismo svix-id, 4 emails efectivamente enviados porque
-- el dedupe sólo veía `status='sent'` y los attempts intermedios
-- nunca llegaban a marcar 'sent' antes de crashear).
--
-- 'queued'         → workflow arrancó, registró intent, pre-sendMail.
-- 'sent'           → sendMail OK + post-process OK.
-- 'post_send_error'→ sendMail OK, pero algo falló después.
-- 'failed'         → sendMail nunca corrió (RPC fail, missing email).
-- 'skipped'        → opt-out previo o duplicate.
--
-- 'failed' y 'skipped' SIGUEN siendo elegibles para reintentar el
-- envío real (son estados donde el correo nunca salió). 'queued' /
-- 'sent' / 'post_send_error' bloquean reenvío.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.is_recent_dispatch(
    p_clerk_user_id TEXT,
    p_email_type    TEXT,
    p_within_minutes INT DEFAULT 360
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = ''
       OR p_email_type IS NULL OR p_email_type = '' THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.email_dispatches
        WHERE clerk_user_id = p_clerk_user_id
          AND email_type = p_email_type
          AND status IN ('sent', 'queued', 'post_send_error')
          AND created_at >= NOW() - (p_within_minutes || ' minutes')::INTERVAL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_recent_dispatch(TEXT, TEXT, INT)
    TO anon, authenticated;
