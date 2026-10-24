-- 20261024b_bandeja_maestria.sql — 🜂 EL AVATAR REAL EN LA MINIATURA (Zak 2026-10-24: «no veo sus avatares, solo unas bolas»)
-- La bandeja de Mensajes trae también la Maestría de la otra persona (other_mastery), así la app pinta su
-- avatar (Nova, Aurelia o Prisma) en la etapa en que está. Es la versión de producción de
-- dm_get_my_conversations (copiada con pg_get_functiondef el 2026-10-24) más ese campo; nada más cambia.
-- Se puede correr más de una vez.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.dm_get_my_conversations(p_clerk_user_id text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    me text := p_clerk_user_id;
    result json;
BEGIN
    WITH mine AS (
        SELECT
            c.id,
            c.last_message_preview,
            c.preview_enc,
            c.last_message_at,
            CASE WHEN c.user_a = me THEN c.user_b ELSE c.user_a END AS other_id,
            CASE WHEN c.user_a = me THEN c.a_last_read_at ELSE c.b_last_read_at END AS my_last_read
        FROM dm_conversations c
        WHERE (c.user_a = me OR c.user_b = me)
          AND c.last_message_at IS NOT NULL
          AND NOT public._community_blocked(me, CASE WHEN c.user_a = me THEN c.user_b ELSE c.user_a END)
    )
    SELECT COALESCE(json_agg(json_build_object(
        'conversation_id', mn.id,
        'other_id', mn.other_id,
        'other_alias', COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = mn.other_id), ''),
        'other_avatar', COALESCE((SELECT selected_avatar FROM user_crystal_state WHERE clerk_user_id = mn.other_id), 'nova'),
        -- 🜂 2026-10-24 · la Maestría del otro (la misma suma que get_community_profile), para pintar su
        -- avatar en su etapa en la miniatura de la bandeja.
        'other_mastery', COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = mn.other_id
              AND dc.checkin_date < (now() AT TIME ZONE 'America/Cancun')::date
        ), 0)::int,
        'last_message_preview', public._dm_decrypt(mn.last_message_preview, mn.preview_enc),
        'last_message_at', mn.last_message_at,
        'unread', (
            SELECT COUNT(*) FROM dm_messages m
            WHERE m.conversation_id = mn.id
              AND m.sender_clerk_id <> me
              AND m.created_at > mn.my_last_read
        )::int
    ) ORDER BY mn.last_message_at DESC NULLS LAST), '[]'::json)
    INTO result FROM mine mn;

    RETURN result;
END;
$function$;
