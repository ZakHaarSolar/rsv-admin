-- 20260720_android_waitlist.sql — Lista de espera de ANDROID + panel de Correos
--
-- 1) Tabla android_waitlist (RLS-locked): los correos que deja la landing de
--    "quiero el Escáner en Android". Sin PII más allá del correo.
-- 2) join_android_waitlist(p_email, p_source) → RPC PÚBLICA (anon puede
--    ejecutarla: la landing es pre-login, no hay token que verificar).
--    Valida formato, normaliza a minúsculas y es idempotente (re-enviar el
--    mismo correo NO duplica ni revienta). Patrón de record_onb_step.
-- 3) admin_get_subscribers(p_admin_clerk_id, p_only_android) → RPC admin
--    (gateway admin-action) que devuelve la lista UNIFICADA de correos del
--    ecosistema, con su ORIGEN y su fecha: la lista de Android, el NODO
--    CENTRAL (newsletter del Portal, opt-in explícito) y los pases de Cámara
--    Solar; o SOLO la lista de Android cuando el interruptor del panel está
--    encendido. Las cuentas de la app (profiles) NO participan (tener cuenta
--    no es opt-in a correos, y ahí viven las cuentas de prueba
--    *+clerk_test@example.com — decisión de Zak 2026-07-20); por defensa se
--    filtra además cualquier @example.com / clerk_test en todos los orígenes.
--    Excluye las cuentas internas y a quien pidió no recibir correos
--    (email_opt_outs), para que la lista que Zak copia sea la lista que de
--    verdad se puede contactar.
-- 4) admin_mark_android_notified(p_admin_clerk_id) → sella notified_at de toda
--    la lista pendiente (para saber a quién ya se le avisó del lanzamiento).
--
-- Pegar COMPLETO en Supabase Dashboard → SQL Editor → New Query → Run.

-- ─────────────────────────────────────────────────────────────────────
-- 1) Tabla
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.android_waitlist (
    email       text PRIMARY KEY,
    source      text NOT NULL DEFAULT 'landing',
    locale      text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    notified_at timestamptz
);

ALTER TABLE public.android_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.android_waitlist FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_android_waitlist_created
    ON public.android_waitlist (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 2) Alta desde la landing (anon, pre-login)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.join_android_waitlist(
    p_email  text,
    p_source text DEFAULT 'landing',
    p_locale text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text;
BEGIN
    v_email := lower(trim(COALESCE(p_email, '')));

    -- Validación de formato (defensiva: la landing valida, pero esto es el
    -- borde real de la base).
    IF v_email !~ '^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$' OR length(v_email) > 254 THEN
        RETURN json_build_object('error', 'invalid_email');
    END IF;

    INSERT INTO android_waitlist (email, source, locale)
    VALUES (
        v_email,
        COALESCE(NULLIF(trim(p_source), ''), 'landing'),
        NULLIF(trim(COALESCE(p_locale, '')), '')
    )
    ON CONFLICT (email) DO NOTHING;

    -- Idempotente a propósito: re-enviar el mismo correo devuelve éxito, para
    -- que la landing no tenga que distinguir "nuevo" de "ya estaba".
    RETURN json_build_object('success', true);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 3) Lista unificada para el panel del Motor
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_subscribers(
    p_admin_clerk_id text,
    p_only_android   boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN (
        WITH internas AS (
            -- Cuentas propias: no son audiencia (mismo criterio que la
            -- Telemetría de Navegación).
            SELECT unnest(ARRAY[
                'cuerpodeluz555@gmail.com',
                'zakhaarsol@pm.me',
                'redsolarviva@pm.me',
                'veocancun@gmail.com',
                'veotuluzinterna@gmail.com',
                'diegosotoborja@gmail.com',
                'zakhaar@pm.me'
            ]) AS email
        ),
        fuentes AS (
            -- La lista de Android (la landing).
            SELECT lower(trim(w.email))  AS email,
                   'android'::text       AS origen,
                   w.created_at          AS fecha,
                   w.notified_at         AS avisado
            FROM android_waitlist w
            WHERE w.email IS NOT NULL AND trim(w.email) <> ''

            UNION ALL

            -- NODO CENTRAL: el newsletter del Portal de Inducción. Es la
            -- fuente con consentimiento MÁS explícito (la persona se apuntó
            -- justamente para recibir avisos), así que pesa más que la cuenta.
            SELECT lower(trim(nc.email)) AS email,
                   'nodo'::text          AS origen,
                   nc.subscribed_at      AS fecha,
                   NULL::timestamptz     AS avisado
            FROM nodo_central nc
            WHERE NOT p_only_android
              AND nc.email IS NOT NULL AND trim(nc.email) <> ''

            UNION ALL

            -- Cámara Solar grupal (pases de exploración). Su fecha es la de
            -- la sesión (event_date), la tabla no lleva created_at.
            -- NOTA: profiles (cuentas de la app) ya NO participa — tener
            -- cuenta no es opt-in a correos, y ahí vivían las cuentas de
            -- prueba *+clerk_test@example.com.
            SELECT lower(trim(ep.email))     AS email,
                   'camara'::text            AS origen,
                   ep.event_date::timestamptz AS fecha,
                   NULL::timestamptz         AS avisado
            FROM exploration_passes ep
            WHERE NOT p_only_android
              AND ep.email IS NOT NULL AND trim(ep.email) <> ''
        ),
        deduped AS (
            -- Un correo = una fila. Si está en varias fuentes gana la de
            -- intención más explícita (android > newsletter > pase) y se
            -- conserva la fecha más vieja. Defensa global: fuera correos de
            -- prueba (@example.com / clerk_test) vengan del origen que vengan.
            SELECT
                f.email,
                CASE WHEN bool_or(f.origen = 'android') THEN 'android'
                     WHEN bool_or(f.origen = 'nodo')    THEN 'nodo'
                     ELSE 'camara' END                       AS origen,
                min(f.fecha)                                 AS fecha,
                max(f.avisado)                               AS avisado,
                bool_or(f.origen = 'android')                AS en_android,
                bool_or(f.origen = 'nodo')                   AS en_newsletter
            FROM fuentes f
            WHERE f.email NOT IN (SELECT email FROM internas)
              AND f.email NOT LIKE '%@example.com'
              AND f.email NOT LIKE '%clerk_test%'
              AND NOT EXISTS (
                  SELECT 1 FROM email_opt_outs o
                  WHERE lower(trim(o.email)) = f.email
              )
            GROUP BY f.email
        )
        SELECT json_build_object(
            'total',       (SELECT count(*) FROM deduped),
            'android',     (SELECT count(*) FROM deduped WHERE en_android),
            'newsletter',  (SELECT count(*) FROM deduped WHERE en_newsletter),
            'rows',        COALESCE((
                SELECT json_agg(row_to_json(d) ORDER BY d.fecha DESC NULLS LAST)
                FROM deduped d
            ), '[]'::json)
        )
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4) Sellar "ya se les avisó"
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_mark_android_notified(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_count    integer;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE android_waitlist SET notified_at = now() WHERE notified_at IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN json_build_object('success', true, 'marcados', v_count);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Permisos (patrón de la casa)
-- ─────────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.join_android_waitlist(text, text, text)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_subscribers(text, boolean)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_mark_android_notified(text)            FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_subscribers(text, boolean)      TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_mark_android_notified(text)         TO service_role;

-- La landing es PRE-LOGIN: no hay token de Clerk que verificar, así que el
-- alta SÍ la puede ejecutar anon (única escritura pública, acotada a insertar
-- un correo validado en una tabla sin lectura pública).
GRANT EXECUTE ON FUNCTION public.join_android_waitlist(text, text, text)   TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
