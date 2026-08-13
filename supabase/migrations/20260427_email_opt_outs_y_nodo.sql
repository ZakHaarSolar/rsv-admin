-- Red Solar Viva · Opt-outs + Nodo Central (lista de correos)
-- =====================================================================
-- Este archivo monta la infraestructura para:
--
-- 1. email_opt_outs — quién ya no quiere recibir correos. Hoy sólo
--    arrancamos con `category='all'` (global). La columna queda lista
--    para granularizar a futuro (transactional vs marketing) sin
--    migrar el schema de nuevo.
--
-- 2. nodo_central — la lista de correos del Nodo. Se llena desde:
--      a) El form "ÚNETE AL NODO CENTRAL" del Portal de Inducción
--         (Origen.tsx → workflow Pipedream "Guardar Mensajes" →
--         RPC record_nodo_subscription).
--      b) Cualquier inserción manual de Diego desde el Dashboard.
--
-- 3. RPCs SECURITY DEFINER que dejan a Pipedream (anon key) escribir
--    sin abrir RLS de las tablas. Y un RPC admin-only que el modal del
--    Motor de Intervención consume para mostrar:
--       ✓ Suscrito al Nodo (verde + fecha de alta)
--       — Sin alta registrada
--       ✗ Dado de baja (rojo + fecha + motivo)
--
-- Patrón canónico del proyecto: anon NUNCA escribe directo a tablas con
-- RLS — entra por RPCs SECURITY DEFINER que validan / sanitizan / loguean.
-- Lo mismo que email_dispatches y decoder_scans.
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_opt_outs (
    email           TEXT PRIMARY KEY,
    category        TEXT NOT NULL DEFAULT 'all'
                    CHECK (category IN ('all','marketing','transactional')),
    opted_out_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason          TEXT,
    source          TEXT,        -- 'unsubscribe_link' | 'admin_manual' | 'bounce' | ...
    metadata        JSONB
);

CREATE INDEX IF NOT EXISTS idx_email_opt_outs_opted_at
    ON public.email_opt_outs (opted_out_at DESC);

ALTER TABLE public.email_opt_outs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_direct_access_opt_outs" ON public.email_opt_outs;
CREATE POLICY "no_direct_access_opt_outs"
    ON public.email_opt_outs
    FOR ALL TO public
    USING (false) WITH CHECK (false);


CREATE TABLE IF NOT EXISTS public.nodo_central (
    email           TEXT PRIMARY KEY,
    subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source          TEXT,        -- 'origen_landing' | 'admin_manual' | 'import' | ...
    last_event_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata        JSONB
);

CREATE INDEX IF NOT EXISTS idx_nodo_central_subscribed_at
    ON public.nodo_central (subscribed_at DESC);

ALTER TABLE public.nodo_central ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_direct_access_nodo_central" ON public.nodo_central;
CREATE POLICY "no_direct_access_nodo_central"
    ON public.nodo_central
    FOR ALL TO public
    USING (false) WITH CHECK (false);


-- ============================================================
-- RPC record_email_opt_out
-- Lo llama el workflow UnsubscribeEmail de Pipedream cuando un
-- tripulante pica el link "Dejar de recibir" del footer.
-- Idempotente: si ya está dado de baja, sólo actualiza opted_out_at /
-- reason / metadata.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_email_opt_out(
    p_email     TEXT,
    p_reason    TEXT DEFAULT NULL,
    p_category  TEXT DEFAULT 'all',
    p_source    TEXT DEFAULT 'unsubscribe_link',
    p_metadata  JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    IF v_email IS NULL OR v_email = '' OR POSITION('@' IN v_email) = 0 THEN
        RETURN false;
    END IF;

    INSERT INTO public.email_opt_outs (email, category, reason, source, metadata)
    VALUES (v_email, COALESCE(p_category,'all'), p_reason, p_source, p_metadata)
    ON CONFLICT (email) DO UPDATE
        SET opted_out_at = NOW(),
            reason = COALESCE(EXCLUDED.reason, public.email_opt_outs.reason),
            category = EXCLUDED.category,
            source = COALESCE(EXCLUDED.source, public.email_opt_outs.source),
            metadata = COALESCE(EXCLUDED.metadata, public.email_opt_outs.metadata);

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_email_opt_out(TEXT, TEXT, TEXT, TEXT, JSONB)
    TO anon, authenticated;


-- ============================================================
-- RPC restore_email_opt_in
-- Para el "deshacer" del landing de baja (dentro de la misma sesión
-- el tripulante puede arrepentirse). Borra el row de email_opt_outs.
-- ============================================================
CREATE OR REPLACE FUNCTION public.restore_email_opt_in(
    p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    IF v_email IS NULL OR v_email = '' THEN
        RETURN false;
    END IF;

    DELETE FROM public.email_opt_outs WHERE email = v_email;
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_email_opt_in(TEXT) TO anon, authenticated;


-- ============================================================
-- RPC is_email_opted_out
-- Lectura pública rápida. La consume cada workflow de email
-- (CicloSellado, futuros) como pre-flight check antes de enviar.
-- Si la categoría especificada está cubierta por una baja 'all'
-- O por una baja específica de esa categoría → true.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_email_opted_out(
    p_email     TEXT,
    p_category  TEXT DEFAULT 'all'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    IF v_email IS NULL OR v_email = '' THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.email_opt_outs
        WHERE email = v_email
          AND (category = 'all' OR category = COALESCE(p_category,'all'))
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_email_opted_out(TEXT, TEXT)
    TO anon, authenticated;


-- ============================================================
-- RPC record_nodo_subscription
-- Lo llama el workflow "Guardar Mensajes" de Pipedream cuando alguien
-- somete el form "ÚNETE AL NODO CENTRAL" en el Portal de Inducción.
-- Idempotente: si ya existe, refresca last_event_at + source.
-- Si el email tiene opt-out activo, NO lo borra — la fila se queda en
-- nodo_central pero el envío sigue bloqueado por is_email_opted_out
-- (el opt-out manda sobre la suscripción).
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_nodo_subscription(
    p_email     TEXT,
    p_source    TEXT DEFAULT 'origen_landing',
    p_metadata  JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
BEGIN
    IF v_email IS NULL OR v_email = '' OR POSITION('@' IN v_email) = 0 THEN
        RETURN false;
    END IF;

    INSERT INTO public.nodo_central (email, source, metadata, last_event_at)
    VALUES (v_email, p_source, p_metadata, NOW())
    ON CONFLICT (email) DO UPDATE
        SET last_event_at = NOW(),
            source = COALESCE(EXCLUDED.source, public.nodo_central.source),
            metadata = COALESCE(EXCLUDED.metadata, public.nodo_central.metadata);

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_nodo_subscription(TEXT, TEXT, JSONB)
    TO anon, authenticated;


-- ============================================================
-- RPC get_email_subscription_status (admin-only)
-- Devuelve el estado completo del email del tripulante para el modal
-- del Motor de Intervención: si está suscrito al Nodo, si está dado
-- de baja, fechas y motivo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_email_subscription_status(
    p_target_clerk_id TEXT,
    p_admin_clerk_id  TEXT
)
RETURNS TABLE (
    email             TEXT,
    in_nodo           BOOLEAN,
    subscribed_at     TIMESTAMPTZ,
    nodo_source       TEXT,
    has_opt_out       BOOLEAN,
    opted_out_at      TIMESTAMPTZ,
    opt_out_reason    TEXT,
    opt_out_category  TEXT,
    opt_out_source    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT LOWER(TRIM(p.email)) INTO v_email
    FROM profiles p
    WHERE p.clerk_user_id = p_target_clerk_id
    LIMIT 1;

    IF v_email IS NULL OR v_email = '' THEN
        RETURN QUERY SELECT
            NULL::TEXT, false, NULL::TIMESTAMPTZ, NULL::TEXT,
            false, NULL::TIMESTAMPTZ, NULL::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        v_email AS email,

        EXISTS(SELECT 1 FROM nodo_central nc WHERE nc.email = v_email) AS in_nodo,

        (SELECT nc.subscribed_at FROM nodo_central nc
         WHERE nc.email = v_email LIMIT 1) AS subscribed_at,

        (SELECT nc.source FROM nodo_central nc
         WHERE nc.email = v_email LIMIT 1) AS nodo_source,

        EXISTS(SELECT 1 FROM email_opt_outs eo WHERE eo.email = v_email) AS has_opt_out,

        (SELECT eo.opted_out_at FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opted_out_at,

        (SELECT eo.reason FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opt_out_reason,

        (SELECT eo.category FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opt_out_category,

        (SELECT eo.source FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opt_out_source;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_subscription_status(TEXT, TEXT)
    TO anon, authenticated;
