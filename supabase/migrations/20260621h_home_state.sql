-- Red Solar Viva · UN SOLO LATIDO — get_home_state (bootstrap del Núcleo)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- POR QUÉ: al abrir el Núcleo la app dispara muchas llamadas sueltas (membresía,
-- ritual, medallas, no-leídos…), y a 10K cada una despierta una función en frío
-- → caro y lento. Esto devuelve TODO ese estado en UNA sola llamada. El cliente
-- lo cachea (stale-while-revalidate) → pinta al instante y el servidor recibe
-- una fracción de los golpes.
--
-- 100% defensivo: cada sub-cálculo va en su propio bloque; si uno falla, el
-- resto igual responde (nunca rompe el arranque del Núcleo).

CREATE OR REPLACE FUNCTION public.get_home_state(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today    date := (now() AT TIME ZONE 'America/Cancun')::date;
    v_email    text;
    v_mem      json := NULL;
    v_total    int := 0;   -- Fotones de por vida (incluye hoy)
    v_today    int := 0;   -- Fotones de hoy
    v_streak   int := 0;
    v_med_unl  int := 0;
    v_med_tot  int := 0;
    v_unread   int := 0;
BEGIN
    -- Correo del Tripulante (la membresía está keyed por correo).
    SELECT email INTO v_email FROM profiles WHERE clerk_user_id = p_clerk_user_id;

    -- Membresía (reusa la lógica existente; best-effort).
    BEGIN
        v_mem := public.get_my_membership(COALESCE(v_email, ''));
    EXCEPTION WHEN OTHERS THEN
        v_mem := NULL;
    END;

    -- Ritual Diario (agregados baratos sobre daily_checkins).
    BEGIN
        SELECT COALESCE(SUM(points), 0)::int INTO v_total
        FROM daily_checkins WHERE clerk_user_id = p_clerk_user_id;

        SELECT COALESCE(SUM(points), 0)::int INTO v_today
        FROM daily_checkins
        WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d_today;

        WITH d AS (
            SELECT DISTINCT checkin_date AS cd
            FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id
              AND checkin_date <> DATE '2000-01-01'
              AND checkin_date <= d_today
        ),
        g AS (
            SELECT cd, (cd - (ROW_NUMBER() OVER (ORDER BY cd))::int) AS grp FROM d
        )
        SELECT CASE
            WHEN (SELECT MAX(cd) FROM d) IS NULL OR (SELECT MAX(cd) FROM d) < d_today - 1 THEN 0
            ELSE (SELECT COUNT(*) FROM g WHERE grp = (SELECT grp FROM g ORDER BY cd DESC LIMIT 1))::int
        END INTO v_streak;
        v_streak := COALESCE(v_streak, 0);
    EXCEPTION WHEN OTHERS THEN
        v_total := 0; v_today := 0; v_streak := 0;
    END;

    -- Medallas (conteos baratos: desbloqueadas / total activas).
    BEGIN
        SELECT COUNT(*)::int INTO v_med_unl
        FROM medal_unlocks WHERE clerk_user_id = p_clerk_user_id;

        SELECT COUNT(*)::int INTO v_med_tot
        FROM medal_tiers mt
        JOIN medal_constelaciones mc
          ON mc.constelacion_key = mt.constelacion_key AND mc.active;
    EXCEPTION WHEN OTHERS THEN
        v_med_unl := 0; v_med_tot := 0;
    END;

    -- Mensajes no leídos (total).
    BEGIN
        SELECT COALESCE(SUM(sub.u), 0)::int INTO v_unread
        FROM (
            SELECT (
                SELECT COUNT(*) FROM dm_messages m
                WHERE m.conversation_id = c.id
                  AND m.sender_clerk_id <> p_clerk_user_id
                  AND m.created_at > (CASE WHEN c.user_a = p_clerk_user_id
                                           THEN c.a_last_read_at
                                           ELSE c.b_last_read_at END)
            ) AS u
            FROM dm_conversations c
            WHERE (c.user_a = p_clerk_user_id OR c.user_b = p_clerk_user_id)
              AND NOT public._community_blocked(
                    p_clerk_user_id,
                    CASE WHEN c.user_a = p_clerk_user_id THEN c.user_b ELSE c.user_a END
                  )
        ) sub;
    EXCEPTION WHEN OTHERS THEN
        v_unread := 0;
    END;

    RETURN json_build_object(
        'membership', v_mem,
        'ritual', json_build_object(
            'total_fotones', v_total,
            'today_fotones', v_today,
            'streak', v_streak
        ),
        'medals', json_build_object('unlocked', v_med_unl, 'total', v_med_tot),
        'unread', v_unread
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_home_state(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_home_state(text) TO service_role;

NOTIFY pgrst, 'reload schema';
