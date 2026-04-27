-- Red Solar Viva · Tabla email_dispatches + RPCs para tracking
-- =====================================================================
-- Diego pidió poder ver desde el modal del Motor de Intervención si el
-- correo "Ciclo Sellado" llegó (o no) a un tripulante específico. Hasta
-- ahora dispatchCicloSellado disparaba el webhook de Pipedream
-- fire-and-forget sin guardar evidencia del envío en la DB → cero
-- visibilidad cuando un correo no aparece en la bandeja del destinatario.
--
-- Esta tabla queda como bitácora pública de envíos. Pipedream
-- (CicloSellado.js) escribe acá apenas termina el sendMail (success o
-- failure), y el modal del Motor lee la fila más reciente por tipo +
-- clerk_user_id para mostrar status visual:
--   ✓ Enviado · 26 abril 14:30
--   ✗ Falló · razón
--   ↷ Saltado · Sintonía Solar activa
--
-- También cubrimos el caso "saltado" porque desde la próxima versión
-- de CicloSellado.js NO enviamos el email a quienes ya tienen Sintonía
-- Solar activa (no necesitan la invitación al checkout — ya son
-- suscriptores). El gate vive en Pipedream usando supabase service role
-- para consultar subscriptions.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS public.email_dispatches (
    id              BIGSERIAL PRIMARY KEY,
    clerk_user_id   TEXT NOT NULL,
    email           TEXT,
    email_type      TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
    error_message   TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_dispatches_clerk_user
    ON public.email_dispatches (clerk_user_id, email_type, created_at DESC);

ALTER TABLE public.email_dispatches ENABLE ROW LEVEL SECURITY;

/* RLS cerrado: nadie puede leer ni escribir directo. Sólo los RPCs
   SECURITY DEFINER de abajo (uno para grabar, uno para leer admin). */
DROP POLICY IF EXISTS "no_direct_access" ON public.email_dispatches;
CREATE POLICY "no_direct_access"
    ON public.email_dispatches
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);


/* ───────────────────────────────────────────────────────────────────
   RPC log_email_dispatch
   Lo llama Pipedream (con service role) o cualquier cliente (anon)
   apenas termina el envío. Insert puro — no necesita admin gate
   porque la información que entra es benigna y trazable.
   ─────────────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.log_email_dispatch(
    p_clerk_user_id TEXT,
    p_email         TEXT,
    p_email_type    TEXT,
    p_status        TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_metadata      JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO public.email_dispatches (
        clerk_user_id, email, email_type, status, error_message, metadata
    ) VALUES (
        p_clerk_user_id, p_email, p_email_type, p_status, p_error_message, p_metadata
    )
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_email_dispatch(
    TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) TO anon, authenticated;


/* ───────────────────────────────────────────────────────────────────
   RPC get_email_dispatch_status
   Lectura admin-only del último estado del envío para un tripulante
   y tipo de email. Lo consume el modal del Motor de Intervención
   (TripulanteDetail) al abrir, para mostrar la bandera visual.
   ─────────────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.get_email_dispatch_status(
    p_target_clerk_id TEXT,
    p_admin_clerk_id  TEXT,
    p_email_type      TEXT
)
RETURNS TABLE (
    status        TEXT,
    sent_at       TIMESTAMPTZ,
    error_message TEXT,
    email         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        ed.status::TEXT,
        ed.created_at AS sent_at,
        ed.error_message::TEXT,
        ed.email::TEXT
    FROM public.email_dispatches ed
    WHERE ed.clerk_user_id = p_target_clerk_id
      AND ed.email_type = p_email_type
    ORDER BY ed.created_at DESC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_dispatch_status(
    TEXT, TEXT, TEXT
) TO anon, authenticated;
