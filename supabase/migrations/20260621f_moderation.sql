-- Red Solar Viva · COMUNIDAD · MODERACIÓN (bloquear · reportar · banear)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- POR QUÉ: antes de abrir la Constelación de la Red a más gente, el Tripulante
-- necesita poder protegerse (bloquear) y avisarnos (reportar), y nosotros
-- necesitamos una cola para revisar y actuar (banear). Sin esto, una sola
-- cuenta tóxica puede arruinar la capa social y no tenemos forma de saberlo.
--
-- QUÉ HACE:
--   (1) BLOQUEAR (acción del Tripulante, instantánea, silenciosa): si A bloquea
--       a B, dejan de verse en el directorio, no pueden iniciarse/escribirse
--       mensajes, y B NO recibe aviso (anti-represalia). Reversible.
--   (2) REPORTAR (acción del Tripulante → llega a NOSOTROS): A reporta a B con un
--       motivo (+ nota opcional) → fila en community_reports (estado 'pendiente').
--       Puede bloquear en el mismo gesto. Nosotros lo revisamos en el Motor.
--   (3) BANEAR (acción NUESTRA, admin): saca a un Tripulante de la capa social —
--       deja de aparecer en el directorio, no puede iniciar chats, su perfil se
--       vuelve privado. Reversible.
--
-- Mismo patrón de seguridad que toda la Comunidad: tablas con RLS sin policies
-- (solo accesibles vía RPC SECURITY DEFINER), REVOKE anon + GRANT service_role,
-- ruteadas por los gateways user-action (Tripulante) / admin-action (nosotros).

-- ════════════════════════════════════════════════════════════════════
-- Tablas
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.community_blocks (
    blocker_clerk_id text NOT NULL,
    blocked_clerk_id text NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_clerk_id, blocked_clerk_id)
);
CREATE INDEX IF NOT EXISTS idx_community_blocks_blocked ON public.community_blocks (blocked_clerk_id);

CREATE TABLE IF NOT EXISTS public.community_reports (
    id                bigserial PRIMARY KEY,
    reporter_clerk_id text NOT NULL,
    reported_clerk_id text NOT NULL,
    reason            text NOT NULL,                 -- acoso | spam | sexual | odio | suplantacion | otro
    note              text NOT NULL DEFAULT '',
    context           text NOT NULL DEFAULT 'perfil',-- perfil | mensaje
    status            text NOT NULL DEFAULT 'pendiente', -- pendiente | revisado | descartado
    action_taken      text NOT NULL DEFAULT '',
    created_at        timestamptz NOT NULL DEFAULT now(),
    resolved_at       timestamptz,
    resolved_by       text
);
CREATE INDEX IF NOT EXISTS idx_community_reports_status   ON public.community_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reports_reported ON public.community_reports (reported_clerk_id);

CREATE TABLE IF NOT EXISTS public.community_bans (
    clerk_user_id text PRIMARY KEY,
    reason        text NOT NULL DEFAULT '',
    banned_by     text,
    banned_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bans    ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- Helpers internos (solo los usan las RPC SECURITY DEFINER de Comunidad).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._community_blocked(a text, b text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM community_blocks
        WHERE (blocker_clerk_id = a AND blocked_clerk_id = b)
           OR (blocker_clerk_id = b AND blocked_clerk_id = a)
    );
$$;

CREATE OR REPLACE FUNCTION public._community_banned(p_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM community_bans WHERE clerk_user_id = p_id);
$$;

REVOKE ALL ON FUNCTION public._community_blocked(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._community_banned(text)        FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- RPCs del Tripulante (gateway user-action; inyecta p_clerk_user_id)
-- ════════════════════════════════════════════════════════════════════

-- Bloquear (silencioso, instantáneo, reversible).
CREATE OR REPLACE FUNCTION public.community_block_user(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE tgt text := COALESCE(p_target_clerk_id, '');
BEGIN
    IF tgt = '' OR tgt = p_clerk_user_id THEN
        RETURN json_build_object('error', 'bad_target');
    END IF;
    INSERT INTO community_blocks (blocker_clerk_id, blocked_clerk_id)
    VALUES (p_clerk_user_id, tgt)
    ON CONFLICT (blocker_clerk_id, blocked_clerk_id) DO NOTHING;
    RETURN json_build_object('ok', true);
END;
$$;

-- Desbloquear.
CREATE OR REPLACE FUNCTION public.community_unblock_user(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM community_blocks
    WHERE blocker_clerk_id = p_clerk_user_id
      AND blocked_clerk_id = COALESCE(p_target_clerk_id, '');
    RETURN json_build_object('ok', true);
END;
$$;

-- Reportar (llega a la cola de moderación; puede bloquear en el mismo gesto).
CREATE OR REPLACE FUNCTION public.community_report_user(
    p_clerk_user_id text,
    p_target_clerk_id text,
    p_reason text DEFAULT 'otro',
    p_note text DEFAULT '',
    p_context text DEFAULT 'perfil',
    p_also_block boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tgt    text := COALESCE(p_target_clerk_id, '');
    v_rsn  text := LEFT(TRIM(COALESCE(p_reason, 'otro')), 40);
    v_note text := LEFT(TRIM(COALESCE(p_note, '')), 600);
    v_ctx  text := CASE WHEN p_context = 'mensaje' THEN 'mensaje' ELSE 'perfil' END;
    rid bigint;
BEGIN
    IF tgt = '' OR tgt = p_clerk_user_id THEN
        RETURN json_build_object('error', 'bad_target');
    END IF;
    -- Anti-flood: máx 1 reporte pendiente del mismo reportante al mismo reportado.
    IF EXISTS (
        SELECT 1 FROM community_reports
        WHERE reporter_clerk_id = p_clerk_user_id
          AND reported_clerk_id = tgt
          AND status = 'pendiente'
    ) THEN
        IF COALESCE(p_also_block, true) THEN
            INSERT INTO community_blocks (blocker_clerk_id, blocked_clerk_id)
            VALUES (p_clerk_user_id, tgt)
            ON CONFLICT DO NOTHING;
        END IF;
        RETURN json_build_object('ok', true, 'already', true);
    END IF;

    INSERT INTO community_reports (reporter_clerk_id, reported_clerk_id, reason, note, context)
    VALUES (p_clerk_user_id, tgt, v_rsn, v_note, v_ctx)
    RETURNING id INTO rid;

    IF COALESCE(p_also_block, true) THEN
        INSERT INTO community_blocks (blocker_clerk_id, blocked_clerk_id)
        VALUES (p_clerk_user_id, tgt)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN json_build_object('ok', true, 'report_id', rid);
END;
$$;

-- Lista de a quién bloqueé (para gestionarlos / desbloquear).
CREATE OR REPLACE FUNCTION public.get_my_blocks(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT COALESCE(json_agg(json_build_object(
        'clerk_user_id', b.blocked_clerk_id,
        'alias', COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = b.blocked_clerk_id), ''),
        'avatar_key', COALESCE((SELECT selected_avatar FROM user_crystal_state WHERE clerk_user_id = b.blocked_clerk_id), 'nova'),
        'created_at', b.created_at
    ) ORDER BY b.created_at DESC), '[]'::json)
    INTO result
    FROM community_blocks b
    WHERE b.blocker_clerk_id = p_clerk_user_id;
    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs admin (gateway admin-action; inyecta p_admin_clerk_id + re-check)
-- ════════════════════════════════════════════════════════════════════

-- Cola de moderación: reportes pendientes (con alias y conteos) + resueltos
-- recientes. Doble blindaje: gateway valida is_admin + esta RPC lo revalida.
CREATE OR REPLACE FUNCTION public.admin_get_moderation_queue(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    SELECT json_build_object(
        'pending', COALESCE((
            SELECT json_agg(json_build_object(
                'id', r.id,
                'reporter_clerk_id', r.reporter_clerk_id,
                'reporter_alias', COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = r.reporter_clerk_id), ''),
                'reporter_email', COALESCE((SELECT email FROM profiles WHERE clerk_user_id = r.reporter_clerk_id), ''),
                'reported_clerk_id', r.reported_clerk_id,
                'reported_alias', COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = r.reported_clerk_id), ''),
                'reported_email', COALESCE((SELECT email FROM profiles WHERE clerk_user_id = r.reported_clerk_id), ''),
                'reason', r.reason,
                'note', r.note,
                'context', r.context,
                'created_at', r.created_at,
                'banned', public._community_banned(r.reported_clerk_id),
                'report_count', (SELECT COUNT(*) FROM community_reports x WHERE x.reported_clerk_id = r.reported_clerk_id),
                'block_count', (SELECT COUNT(*) FROM community_blocks b WHERE b.blocked_clerk_id = r.reported_clerk_id)
            ) ORDER BY r.created_at DESC)
            FROM community_reports r WHERE r.status = 'pendiente'
        ), '[]'::json),
        'resolved', COALESCE((
            SELECT json_agg(json_build_object(
                'id', r.id,
                'reported_alias', COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = r.reported_clerk_id), ''),
                'reason', r.reason,
                'status', r.status,
                'action_taken', r.action_taken,
                'resolved_at', r.resolved_at
            ) ORDER BY r.resolved_at DESC)
            FROM (
                SELECT * FROM community_reports WHERE status <> 'pendiente'
                ORDER BY resolved_at DESC NULLS LAST LIMIT 30
            ) r
        ), '[]'::json),
        'stats', json_build_object(
            'pending_count', (SELECT COUNT(*) FROM community_reports WHERE status = 'pendiente'),
            'banned_count',  (SELECT COUNT(*) FROM community_bans)
        )
    ) INTO result;
    RETURN result;
END;
$$;

-- Detalle de moderación de un Tripulante (su perfil + reportes en su contra).
CREATE OR REPLACE FUNCTION public.admin_get_user_moderation(
    p_admin_clerk_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE tgt text := COALESCE(p_target_clerk_id, ''); result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    SELECT json_build_object(
        'clerk_user_id', tgt,
        'alias',   COALESCE((SELECT alias FROM community_profiles WHERE clerk_user_id = tgt), ''),
        'bio',     COALESCE((SELECT bio FROM community_profiles WHERE clerk_user_id = tgt), ''),
        'visible', COALESCE((SELECT visible FROM community_profiles WHERE clerk_user_id = tgt), false),
        'email',   COALESCE((SELECT email FROM profiles WHERE clerk_user_id = tgt), ''),
        'banned',  public._community_banned(tgt),
        'report_count', (SELECT COUNT(*) FROM community_reports WHERE reported_clerk_id = tgt),
        'block_count',  (SELECT COUNT(*) FROM community_blocks WHERE blocked_clerk_id = tgt),
        'reports', COALESCE((
            SELECT json_agg(json_build_object(
                'reason', reason, 'note', note, 'context', context,
                'status', status, 'created_at', created_at
            ) ORDER BY created_at DESC)
            FROM community_reports WHERE reported_clerk_id = tgt
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

-- Resolver un reporte (revisado | descartado) + nota de acción.
CREATE OR REPLACE FUNCTION public.admin_resolve_report(
    p_admin_clerk_id text,
    p_report_id bigint,
    p_status text DEFAULT 'revisado',
    p_action text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_status text := CASE WHEN p_status = 'descartado' THEN 'descartado' ELSE 'revisado' END;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    UPDATE community_reports
    SET status = v_status,
        action_taken = LEFT(COALESCE(p_action, ''), 200),
        resolved_at = now(),
        resolved_by = p_admin_clerk_id
    WHERE id = p_report_id;
    RETURN json_build_object('ok', true);
END;
$$;

-- Banear de la capa social (no aparece, no puede iniciar chats, perfil privado).
CREATE OR REPLACE FUNCTION public.admin_ban_community_user(
    p_admin_clerk_id text,
    p_target_clerk_id text,
    p_reason text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE tgt text := COALESCE(p_target_clerk_id, '');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF tgt = '' THEN RETURN json_build_object('error', 'bad_target'); END IF;
    INSERT INTO community_bans (clerk_user_id, reason, banned_by)
    VALUES (tgt, LEFT(COALESCE(p_reason, ''), 200), p_admin_clerk_id)
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET reason = EXCLUDED.reason, banned_by = EXCLUDED.banned_by, banned_at = now();
    -- Lo saca del directorio de inmediato (perfil privado).
    UPDATE community_profiles SET visible = false, updated_at = now() WHERE clerk_user_id = tgt;
    RETURN json_build_object('ok', true);
END;
$$;

-- Quitar el ban (no re-publica el perfil; el Tripulante decide volver a optar).
CREATE OR REPLACE FUNCTION public.admin_unban_community_user(
    p_admin_clerk_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM community_bans WHERE clerk_user_id = COALESCE(p_target_clerk_id, '');
    RETURN json_build_object('ok', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- CREATE OR REPLACE de las RPCs de Comunidad para FILTRAR bloqueos + bans.
-- Misma firma → conservan los permisos ya aplicados.
-- ════════════════════════════════════════════════════════════════════

-- Directorio: oculta a quien bloqueaste (o te bloqueó) y a los baneados.
CREATE OR REPLACE FUNCTION public.get_community_directory(
    p_clerk_user_id text,
    p_interest text DEFAULT NULL,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    lim  int  := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 60);
    off  int  := GREATEST(COALESCE(p_offset, 0), 0);
    intf text := NULLIF(TRIM(COALESCE(p_interest, '')), '');
    result json;
BEGIN
    WITH visibles AS (
        SELECT cp.clerk_user_id, cp.alias, cp.bio
        FROM community_profiles cp
        WHERE cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
          AND cp.clerk_user_id <> p_clerk_user_id   -- no te muestras a ti mismo
          AND NOT public._community_blocked(p_clerk_user_id, cp.clerk_user_id)  -- bloqueos (ambas direcciones)
          AND NOT public._community_banned(cp.clerk_user_id)                    -- baneados
          AND (
            intf IS NULL
            OR EXISTS (
                SELECT 1 FROM community_profile_interests pi
                WHERE pi.clerk_user_id = cp.clerk_user_id AND pi.interest_key = intf
            )
          )
    ),
    enriched AS (
        SELECT
            v.clerk_user_id,
            v.alias,
            v.bio,
            COALESCE(s.selected_avatar, 'nova') AS avatar_key,
            COALESCE(s.equipped, '{}'::jsonb)   AS equipped,
            COALESCE((
                SELECT SUM(dc.points) FROM daily_checkins dc
                WHERE dc.clerk_user_id = v.clerk_user_id AND dc.checkin_date < d_today
            ), 0)::int AS mastery
        FROM visibles v
        LEFT JOIN user_crystal_state s ON s.clerk_user_id = v.clerk_user_id
    ),
    page AS (
        SELECT
            e.clerk_user_id,
            e.alias,
            e.bio,
            e.avatar_key,
            e.equipped,
            e.mastery,
            COALESCE((
                SELECT json_agg(pi.interest_key ORDER BY pi.interest_key)
                FROM community_profile_interests pi
                WHERE pi.clerk_user_id = e.clerk_user_id
            ), '[]'::json) AS interests
        FROM enriched e
        ORDER BY e.mastery DESC, e.alias ASC, e.clerk_user_id ASC
        LIMIT lim OFFSET off
    )
    SELECT json_build_object(
        'total', (SELECT COUNT(*) FROM enriched),
        'profiles', COALESCE(
            (SELECT json_agg(row_to_json(pg) ORDER BY pg.mastery DESC, pg.alias ASC, pg.clerk_user_id ASC) FROM page pg),
            '[]'::json
        ),
        'interests', COALESCE((
            SELECT json_agg(json_build_object('key', interest_key, 'label', label)
                            ORDER BY sort_order, label)
            FROM community_interests WHERE active
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label, 'params', params
            ) ORDER BY kind, sort_order, label)
            FROM crystal_catalog WHERE active
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- Detalle de un perfil: si hay bloqueo (cualquier dirección) o ban → not_found.
CREATE OR REPLACE FUNCTION public.get_community_profile(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    tgt text := COALESCE(p_target_clerk_id, '');
    v_alias text; v_bio text; v_avatar text; v_equipped jsonb; v_mastery int; v_bd date;
    v_scan json;
    result json;
BEGIN
    IF public._community_blocked(p_clerk_user_id, tgt) OR public._community_banned(tgt) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT
        cp.alias, cp.bio, cp.birthdate,
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_bd, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND cp.visible
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> '';

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT json_build_object(
        'indice',     sv.indice_silicio,
        'fisico',     sv.hardware_fisico,
        'mental',     sv.procesador_mental,
        'emocional',  sv.motor_emocional,
        'financiero', sv.gravedad_financiera,
        'vector',     sv.vector_expansion,
        'orbita',     sv.orbita_relacional,
        'scanned_at', sv.created_at
    ) INTO v_scan
    FROM scan_vibracional sv
    WHERE sv.clerk_user_id = tgt
      AND sv.cycle_scanned_json LIKE '%"fisico"%'
      AND sv.cycle_scanned_json LIKE '%"mental"%'
      AND sv.cycle_scanned_json LIKE '%"emocional"%'
      AND sv.cycle_scanned_json LIKE '%"financiero"%'
      AND sv.cycle_scanned_json LIKE '%"vector"%'
      AND sv.cycle_scanned_json LIKE '%"orbita"%'
    ORDER BY sv.created_at DESC
    LIMIT 1;

    SELECT json_build_object(
        'clerk_user_id', tgt,
        'alias', v_alias,
        'bio', v_bio,
        'avatar_key', v_avatar,
        'equipped', v_equipped,
        'mastery', v_mastery,
        'age', CASE WHEN v_bd IS NULL THEN NULL
                    ELSE date_part('year', age(v_bd))::int END,
        'scan', v_scan,
        'interests', COALESCE((
            SELECT json_agg(json_build_object('key', ci.interest_key, 'label', ci.label)
                            ORDER BY ci.sort_order, ci.label)
            FROM community_profile_interests pi
            JOIN community_interests ci ON ci.interest_key = pi.interest_key
            WHERE pi.clerk_user_id = tgt
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label, 'params', params
            ) ORDER BY kind, sort_order, label)
            FROM crystal_catalog WHERE active
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- Inicio de chat: bloqueado (cualquier dirección) o baneado → no se puede.
CREATE OR REPLACE FUNCTION public.dm_start_conversation(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me  text := p_clerk_user_id;
    tgt text := COALESCE(p_target_clerk_id, '');
    a   text; b text; cid bigint;
BEGIN
    IF tgt = '' OR tgt = me THEN
        RETURN json_build_object('error', 'bad_target');
    END IF;

    IF public._community_blocked(me, tgt) THEN
        RETURN json_build_object('error', 'blocked');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM community_profiles cp
        WHERE cp.clerk_user_id = tgt
          AND cp.visible
          AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
    ) OR public._community_banned(tgt) THEN
        RETURN json_build_object('error', 'target_unavailable');
    END IF;

    IF me < tgt THEN a := me; b := tgt; ELSE a := tgt; b := me; END IF;

    INSERT INTO dm_conversations (user_a, user_b)
    VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
    RETURNING id INTO cid;

    RETURN json_build_object('ok', true, 'conversation_id', cid);
END;
$$;

-- Enviar mensaje: si hay bloqueo (cualquier dirección) en un hilo existente → no.
CREATE OR REPLACE FUNCTION public.dm_send_message(
    p_clerk_user_id text,
    p_conversation_id bigint,
    p_body text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv     dm_conversations%ROWTYPE;
    other    text;
    v_body   text := LEFT(TRIM(COALESCE(p_body, '')), 2000);
    v_key    text;
    v_stored text;
    v_prev   text;
    v_enc    boolean := false;
    mid      bigint;
    ts       timestamptz;
BEGIN
    SELECT * INTO conv FROM dm_conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN RETURN json_build_object('error', 'no_conversation'); END IF;
    IF p_clerk_user_id <> conv.user_a AND p_clerk_user_id <> conv.user_b THEN
        RETURN json_build_object('error', 'not_participant');
    END IF;
    IF length(v_body) = 0 THEN RETURN json_build_object('error', 'empty'); END IF;

    other := CASE WHEN conv.user_a = p_clerk_user_id THEN conv.user_b ELSE conv.user_a END;
    IF public._community_blocked(p_clerk_user_id, other) THEN
        RETURN json_build_object('error', 'blocked');
    END IF;

    v_key := public._dm_key();
    IF v_key IS NOT NULL THEN
        BEGIN
            v_stored := armor(pgp_sym_encrypt(v_body, v_key));
            v_prev   := armor(pgp_sym_encrypt(LEFT(v_body, 120), v_key));
            v_enc    := true;
        EXCEPTION WHEN OTHERS THEN
            v_stored := v_body; v_prev := LEFT(v_body, 120); v_enc := false;
        END;
    ELSE
        v_stored := v_body; v_prev := LEFT(v_body, 120);
    END IF;

    INSERT INTO dm_messages (conversation_id, sender_clerk_id, body, enc)
    VALUES (p_conversation_id, p_clerk_user_id, v_stored, v_enc)
    RETURNING id, created_at INTO mid, ts;

    UPDATE dm_conversations
    SET last_message_at = ts,
        last_message_preview = v_prev,
        preview_enc = v_enc,
        a_last_read_at = CASE WHEN p_clerk_user_id = user_a THEN ts ELSE a_last_read_at END,
        b_last_read_at = CASE WHEN p_clerk_user_id = user_b THEN ts ELSE b_last_read_at END
    WHERE id = p_conversation_id;

    RETURN json_build_object('ok', true, 'message_id', mid, 'created_at', ts);
END;
$$;

-- Bandeja: oculta los hilos con Tripulantes bloqueados.
CREATE OR REPLACE FUNCTION public.dm_get_my_conversations(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ════════════════════════════════════════════════════════════════════
-- PERMISOS (el candado): REVOKE anon, GRANT service_role.
-- ════════════════════════════════════════════════════════════════════
-- RPCs del Tripulante:
REVOKE EXECUTE ON FUNCTION public.community_block_user(text, text)                       FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.community_block_user(text, text)                       TO service_role;
REVOKE EXECUTE ON FUNCTION public.community_unblock_user(text, text)                     FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.community_unblock_user(text, text)                     TO service_role;
REVOKE EXECUTE ON FUNCTION public.community_report_user(text, text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.community_report_user(text, text, text, text, text, boolean) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_my_blocks(text)                                    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_blocks(text)                                    TO service_role;
-- RPCs admin:
REVOKE EXECUTE ON FUNCTION public.admin_get_moderation_queue(text)                       FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_moderation_queue(text)                       TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_moderation(text, text)                  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_user_moderation(text, text)                  TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_report(text, bigint, text, text)         FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_resolve_report(text, bigint, text, text)         TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_ban_community_user(text, text, text)             FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_ban_community_user(text, text, text)             TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_unban_community_user(text, text)                 FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_unban_community_user(text, text)                 TO service_role;

NOTIFY pgrst, 'reload schema';
