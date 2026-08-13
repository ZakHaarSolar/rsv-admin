-- 20260627b_app_feedback.sql
-- Buzón de ideas/mejoras de la app (Mi Núcleo → Ajustes → "Comparte una idea").
-- El Tripulante escribe una propuesta y puede marcarla ANÓNIMA:
--   · NO anónima → se guarda su clerk_user_id (el Motor resuelve nombre/correo).
--   · anónima    → clerk_user_id = NULL (no sabemos quién la mandó).
-- Captura vía gateway user-action (id verificado inyectado). Lectura admin para
-- el Motor de Intervención vía admin-action (RPC creada + REVOKE; el panel del
-- Motor es web/Code y se conecta en una iteración aparte — mientras, se ve en
-- Supabase → Table Editor → app_feedback).

CREATE TABLE IF NOT EXISTS public.app_feedback (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text,                         -- NULL si anónimo
    message       text NOT NULL,
    anonymous     boolean NOT NULL DEFAULT false,
    status        text NOT NULL DEFAULT 'nuevo', -- nuevo | visto | archivado
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_feedback_created_idx
    ON public.app_feedback (created_at DESC);

-- RLS activo SIN policies → solo service_role (los gateways) accede.
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_feedback FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- submit_app_feedback — el Tripulante envía una idea (gateway user-action).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.submit_app_feedback(
    p_clerk_user_id text,
    p_message text,
    p_anonymous boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_msg  text := LEFT(TRIM(COALESCE(p_message, '')), 2000);
    v_anon boolean := COALESCE(p_anonymous, false);
BEGIN
    IF length(v_msg) < 2 THEN
        RETURN json_build_object('ok', false, 'error', 'empty');
    END IF;
    INSERT INTO app_feedback (clerk_user_id, message, anonymous)
    VALUES (
        CASE WHEN v_anon THEN NULL ELSE NULLIF(TRIM(COALESCE(p_clerk_user_id, '')), '') END,
        v_msg,
        v_anon
    );
    RETURN json_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_app_feedback(text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.submit_app_feedback(text, text, boolean) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- admin_get_app_feedback — lista para el Motor (gateway admin-action). DORMANT:
-- creada + REVOKE; se enruta cuando el panel del Motor exista. Resuelve el
-- nombre desde profiles cuando NO es anónima.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_app_feedback(
    p_admin_clerk_id text,
    p_limit integer DEFAULT 200
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    result json;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT
            f.id, f.message, f.anonymous, f.status, f.created_at,
            CASE WHEN f.anonymous THEN NULL ELSE f.clerk_user_id END AS clerk_user_id,
            CASE WHEN f.anonymous THEN NULL ELSE (
                SELECT p.full_name FROM profiles p
                WHERE p.clerk_user_id = f.clerk_user_id LIMIT 1
            ) END AS full_name
        FROM app_feedback f
        ORDER BY f.created_at DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 1000)
    ) r;
    RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_app_feedback(text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_app_feedback(text, integer) TO service_role;
