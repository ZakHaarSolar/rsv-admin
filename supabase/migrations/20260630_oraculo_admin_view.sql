-- Red Solar Viva · Espejo Vibracional — vista admin de conversaciones (ANÓNIMA)
-- =====================================================================
-- Lee las conversaciones recientes del Espejo para que el Motor (panel "Espejo")
-- las revise y se afine la calidad del asistente. ANONIMIZADO: NO devuelve email
-- ni nombre — solo un alias estable por usuario (hash corto del clerk_user_id),
-- el texto de los mensajes y las fechas. Admin-gated (profiles.is_admin) +
-- inyección de p_admin_clerk_id por el gateway admin-action; REVOKE a anon.

CREATE OR REPLACE FUNCTION public.admin_get_oraculo_conversations(
    p_admin_clerk_id text,
    p_limit integer DEFAULT 40
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result   json;
BEGIN
    -- bool_or(COALESCE(...)) tolera perfiles duplicados (toma true si alguno lo es).
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not_admin';
    END IF;

    SELECT COALESCE(json_agg(c ORDER BY c.last_at DESC NULLS LAST), '[]'::json)
    INTO v_result
    FROM (
        SELECT
            conv.id AS conv_id,
            'Nodo ' || substr(md5(conv.clerk_user_id), 1, 6) AS alias,
            conv.last_at,
            (
                SELECT COALESCE(json_agg(json_build_object(
                    'role', m.role,
                    'content', m.content,
                    'created_at', m.created_at
                ) ORDER BY m.created_at ASC), '[]'::json)
                FROM public.oraculo_messages m
                WHERE m.conversation_id = conv.id
            ) AS messages,
            (
                SELECT COUNT(*) FROM public.oraculo_messages m2
                WHERE m2.conversation_id = conv.id
            ) AS msg_count
        FROM public.oraculo_conversations conv
        ORDER BY conv.last_at DESC NULLS LAST
        LIMIT GREATEST(1, LEAST(p_limit, 200))
    ) c;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    TO service_role;
