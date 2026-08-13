-- 20260730b_espejo_orden_mensajes.sql
-- 🜂 EL ORDEN DE LOS MENSAJES DEL ESPEJO (bug de Zak: "mi mensaje abajo y la
-- contestación arriba", visto dentro del modo conversación).
--
-- CAUSA: oraculo-chat guarda la pregunta y la respuesta en UN SOLO insert = una
-- transacción, y `created_at DEFAULT now()` devuelve el instante de INICIO DE
-- TRANSACCIÓN: idéntico al microsegundo para las dos filas. Con ese empate
-- exacto, `ORDER BY created_at` no tiene desempate y Postgres devuelve el par
-- en el orden que le convenga.
--
-- El edge (oraculo-chat v1.17) ya escribe timestamps EXPLÍCITOS separados, así
-- que los mensajes NUEVOS nacen ordenados. Esta migración endereza lo YA
-- GUARDADO en los dos lectores que viven en SQL, sin migrar una sola fila:
--   1. espejo_memoria_get_material    → el destilador de la memoria del Espejo
--      (con el material invertido, la ficha aprende los roles cruzados).
--   2. admin_get_oraculo_conversations → el panel Motor -> "Espejo".
-- Desempate: `role DESC` ('user' > 'assistant' alfabéticamente → la pregunta
-- queda antes que la respuesta; `role ASC` donde el barrido va DESC).
--
-- Idempotente. Cuerpos copiados VERBATIM de sus migraciones vigentes
-- (20260729c y 20260724i) con el ORDER BY como ÚNICO cambio.
-- Se re-afirman REVOKE/GRANT al final: un CREATE OR REPLACE reabre EXECUTE a PUBLIC.

CREATE OR REPLACE FUNCTION public.espejo_memoria_get_material(
    p_clerk_user_id text,
    p_conversation_ids uuid[]
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ficha text;
    v_regen boolean := false;
    v_msgs  json := '[]'::json;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    BEGIN
        SELECT public._oraculo_decrypt(m.ficha, m.enc), COALESCE(m.regen_requested, false)
          INTO v_ficha, v_regen
          FROM espejo_memoria m
         WHERE m.clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        SELECT COALESCE(json_agg(json_build_object(
                   'role',    s.role,
                   'conv',    s.conversation_id,
                   'at',      s.created_at,
                   'content', left(public._oraculo_decrypt(s.content, s.enc), 1200)
               ) ORDER BY s.created_at ASC, s.role DESC), '[]'::json)
          INTO v_msgs
          FROM (
              SELECT m.role, m.conversation_id, m.created_at, m.content, m.enc
                FROM oraculo_messages m
                JOIN oraculo_conversations c ON c.id = m.conversation_id
               WHERE c.clerk_user_id = p_clerk_user_id
                 AND m.clerk_user_id = p_clerk_user_id
                 AND m.conversation_id = ANY(COALESCE(p_conversation_ids, '{}'::uuid[]))
               ORDER BY m.created_at DESC, m.role ASC
               LIMIT 160
          ) s;
    EXCEPTION WHEN OTHERS THEN v_msgs := '[]'::json; END;

    RETURN json_build_object(
        'ficha',    COALESCE(left(v_ficha, 3500), ''),
        'regen',    v_regen,
        'messages', v_msgs
    );
END $$;

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
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN RAISE EXCEPTION 'not_admin'; END IF;

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
                    'content', public._oraculo_decrypt(m.content, m.enc),
                    'created_at', m.created_at
                ) ORDER BY m.created_at ASC, m.role DESC), '[]'::json)
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

-- Permisos re-afirmados (el CREATE OR REPLACE los reabre a PUBLIC).
REVOKE ALL ON FUNCTION public.espejo_memoria_get_material(text, uuid[])
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.espejo_memoria_get_material(text, uuid[])
    TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    TO service_role;
