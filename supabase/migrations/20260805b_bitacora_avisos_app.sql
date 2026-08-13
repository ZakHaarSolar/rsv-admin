-- Red Solar Viva · BITÁCORA DE AVISOS DE LA APP
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere: 20260629_app_release + 20260730_app_lockdown ya aplicados.
--
-- QUÉ RESUELVE
--   Hasta hoy el Motor mostraba solo el estado ACTUAL ("versión en circulación
--   1.1.3", "bloqueo inactivo") y nada de lo que pasó antes: no había forma de
--   saber si una versión ya se publicó, cuándo, ni si alguna vez se activó el
--   freno de emergencia. Zak, textual: "se me olvida si ya mandamos ese
--   broadcast o no, porque no pones un log de los broadcasts que yo mande".
--
--   Ahora cada movimiento de la pestaña App queda anotado con fecha, quién lo
--   hizo y qué había antes. Tres tipos:
--     · version   — se tocó el aviso de versión. Si el número CAMBIÓ es una
--                   publicación de verdad (v_prev queda como testigo); si no
--                   cambió, fue solo un ajuste del mensaje.
--     · lock_on   — se activó el freno de emergencia, con su versión mínima.
--     · lock_off  — se desactivó.

CREATE TABLE IF NOT EXISTS public.app_release_log (
    id           bigserial PRIMARY KEY,
    kind         text        NOT NULL,          -- version | lock_on | lock_off
    version      text        NOT NULL DEFAULT '',  -- la que quedó vigente
    version_prev text        NOT NULL DEFAULT '',  -- la que había antes
    min_version  text        NOT NULL DEFAULT '',  -- solo en lock_on
    message      text        NOT NULL DEFAULT '',
    admin_email  text        NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_release_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_release_log FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_app_release_log_fecha
    ON public.app_release_log (created_at DESC);

-- ════════════════════════════════════════════════════════════════════
-- 1) admin_set_app_release — cuerpo fiel de 20260629 + la anotación.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_set_app_release(
    p_admin_clerk_id text,
    p_latest_version text,
    p_message        text,
    p_store_url      text,
    p_force          boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prev  text;
    v_now   text;
    v_email text;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT latest_version INTO v_prev FROM app_release WHERE id = 1;

    UPDATE app_release SET
        latest_version = COALESCE(NULLIF(TRIM(p_latest_version), ''), latest_version),
        message        = COALESCE(NULLIF(TRIM(p_message), ''), message),
        store_url      = COALESCE(NULLIF(TRIM(p_store_url), ''), store_url),
        force          = COALESCE(p_force, false),
        updated_at     = now()
    WHERE id = 1;

    SELECT latest_version INTO v_now FROM app_release WHERE id = 1;
    SELECT COALESCE(email, '') INTO v_email FROM profiles WHERE clerk_user_id = p_admin_clerk_id;

    BEGIN
        INSERT INTO app_release_log (kind, version, version_prev, message, admin_email)
        VALUES ('version', COALESCE(v_now, ''), COALESCE(v_prev, ''),
                COALESCE(NULLIF(TRIM(p_message), ''), ''), COALESCE(v_email, ''));
    EXCEPTION WHEN OTHERS THEN
        -- La bitácora nunca puede impedir que se publique una versión.
        NULL;
    END;

    RETURN (SELECT get_app_release());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_app_release(text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_app_release(text, text, text, text, boolean) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 2) admin_set_app_lockdown — cuerpo fiel de 20260730 + la anotación.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_set_app_lockdown(
    p_admin_clerk_id text,
    p_active         boolean,
    p_min_version    text,
    p_message        text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text;
    v_min   text;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Activar EXIGE una versión mínima real: un bloqueo sin versión no
    -- sabría a quién frenar y el cliente lo ignoraría (fail-open).
    IF COALESCE(p_active, false) = true
       AND COALESCE(NULLIF(TRIM(p_min_version), ''), '') = '' THEN
        RETURN json_build_object('error', 'missing_min_version');
    END IF;

    UPDATE app_release SET
        lock_active      = COALESCE(p_active, false),
        lock_min_version = COALESCE(TRIM(p_min_version), lock_min_version),
        lock_message     = COALESCE(NULLIF(TRIM(p_message), ''), lock_message),
        updated_at       = now()
    WHERE id = 1;

    SELECT lock_min_version INTO v_min FROM app_release WHERE id = 1;
    SELECT COALESCE(email, '') INTO v_email FROM profiles WHERE clerk_user_id = p_admin_clerk_id;

    BEGIN
        INSERT INTO app_release_log (kind, min_version, message, admin_email)
        VALUES (
            CASE WHEN COALESCE(p_active, false) THEN 'lock_on' ELSE 'lock_off' END,
            COALESCE(v_min, ''),
            COALESCE(NULLIF(TRIM(p_message), ''), ''),
            COALESCE(v_email, '')
        );
    EXCEPTION WHEN OTHERS THEN
        -- El freno de emergencia jamás se frena por su propia bitácora.
        NULL;
    END;

    RETURN (SELECT get_app_release());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_app_lockdown(text, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_set_app_lockdown(text, boolean, text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 3) LECTURA — para el panel del Motor (pestaña App).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_app_release_log(
    p_admin_clerk_id text,
    p_limit          int DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lim int := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN COALESCE(
        (SELECT json_agg(row_to_json(l) ORDER BY l.created_at DESC, l.id DESC)
           FROM (
                SELECT id, kind, version, version_prev, min_version,
                       message, admin_email, created_at
                FROM app_release_log
                ORDER BY created_at DESC, id DESC
                LIMIT v_lim
           ) l),
        '[]'::json
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_app_release_log(text, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_app_release_log(text, int) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 4) SIEMBRA — la versión que hoy está en circulación queda como primera
--    entrada, para que la bitácora no arranque en blanco fingiendo que
--    nunca se publicó nada. Se marca con la fecha del último cambio real
--    de app_release, no con la de hoy.
-- ════════════════════════════════════════════════════════════════════
INSERT INTO public.app_release_log (kind, version, version_prev, message, admin_email, created_at)
SELECT 'version', latest_version, '', message, '(anterior a la bitácora)', updated_at
FROM public.app_release
WHERE id = 1
  AND NOT EXISTS (SELECT 1 FROM public.app_release_log);

-- Verificar:  SELECT * FROM app_release_log ORDER BY created_at DESC;
