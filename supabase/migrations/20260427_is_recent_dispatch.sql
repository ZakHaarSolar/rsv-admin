-- Red Solar Viva · is_recent_dispatch
-- =====================================================================
-- Pre-flight idempotente para los workflows de email. Devuelve TRUE si
-- ya hay un envío exitoso del mismo email_type para el mismo
-- clerk_user_id dentro de los últimos N minutos.
--
-- Caso de uso primario: BienvenidaNodo se dispara desde el webhook
-- user.created de Clerk. Clerk hace retry automático si no recibe 2xx
-- en pocos segundos — y SMTP de ProtonMail puede tardar varios segundos
-- → el workflow corre dos veces y la persona recibe dos correos. El
-- pre-flight chequea email_dispatches y skipea si encuentra un row
-- reciente con status='sent'.
--
-- Por qué un RPC y no un fetch directo a la tabla: email_dispatches
-- tiene RLS cerrado con USING(false). Sólo entra por RPCs
-- SECURITY DEFINER. Mismo patrón que el resto del proyecto.
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
          AND status = 'sent'
          AND created_at >= NOW() - (p_within_minutes || ' minutes')::INTERVAL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_recent_dispatch(TEXT, TEXT, INT)
    TO anon, authenticated;
