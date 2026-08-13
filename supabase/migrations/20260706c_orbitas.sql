-- Red Solar Viva · SINCRONIZADOR DE ÓRBITAS — salas multi-dispositivo
-- =====================================================================
-- 20260706c_orbitas.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action v1.32 (suma create_orbita_room / join_orbita_room /
-- get_orbita_room / orbita_room_action al whitelist) + Orbitas.tsx v1.0
-- (Simulador 4 en escaner-app).
--
-- Qué es: juego de interacción grupal (2-12 nodos). El modo "un solo
-- dispositivo" es 100% local (no toca la DB). Este schema sirve SOLO a las
-- salas multi-dispositivo: el anfitrión abre una sala con código de 4
-- dígitos, los demás entran gratis desde su Escáner, y el estado del juego
-- vive aquí (fuente de verdad; el broadcast de Realtime solo avisa "algo
-- cambió" y cada cliente re-lee por RPC).
--
-- Freemium (server-side, la verdad vive aquí; el cliente solo pre-gatea):
--   · Crear sala → SOLO membresía activa (Sintonía/Inmersión, mismo criterio
--     _is_active_member de 20260625e_dm_stickers.sql). El anfitrión "ilumina"
--     la sala: todos los que entren juegan la experiencia completa.
--   · Unirse a sala → cualquier Tripulante identificado, gratis.
--
-- Privacidad: la sala guarda SOLO clerk ids + nombres de pila que los
-- propios jugadores escriben. Las respuestas del juego se hablan en voz
-- alta entre presentes: NUNCA se registran en la DB.
--
-- Tabla RLS-locked SIN policies → solo accesible vía las RPCs SECURITY
-- DEFINER de abajo, ruteadas por el gateway user-action (que inyecta el
-- p_clerk_user_id verificado del token; el del cliente se descarta).

CREATE TABLE IF NOT EXISTS public.orbita_rooms (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code          text NOT NULL,
    host_clerk_id text NOT NULL,
    status        text NOT NULL DEFAULT 'lobby',  -- lobby | play | done | closed
    players       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{cid,name}]
    state         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- GameSnap del cliente
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orbita_rooms_code ON public.orbita_rooms (code);
CREATE INDEX IF NOT EXISTS idx_orbita_rooms_updated ON public.orbita_rooms (updated_at);

ALTER TABLE public.orbita_rooms ENABLE ROW LEVEL SECURITY;
-- (Sin policies → cero acceso anon/authenticated; solo service_role vía RPC.)

-- ── Helper interno: fila → json (una sola forma en todas las RPCs) ──
CREATE OR REPLACE FUNCTION public._orbita_room_json(r public.orbita_rooms)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',      r.id,
        'code',    r.code,
        'status',  r.status,
        'host',    r.host_clerk_id,
        'players', r.players,
        'state',   r.state
    );
$$;

-- ── Helper interno: ¿el caller es jugador de la sala? ────────────────
CREATE OR REPLACE FUNCTION public._orbita_is_player(r public.orbita_rooms, p_cid text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements(r.players) e
        WHERE e->>'cid' = p_cid
    );
$$;

-- ── Crear sala (SOLO membresía activa; el anfitrión ilumina la sala) ──
CREATE OR REPLACE FUNCTION public.create_orbita_room(
    p_clerk_user_id text,
    p_name          text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name text := LEFT(TRIM(COALESCE(p_name, '')), 18);
    v_code text;
    v_try  int := 0;
    v_row  public.orbita_rooms;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF NOT public._is_active_member(p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_member');
    END IF;
    IF length(v_name) = 0 THEN v_name := 'Nodo'; END IF;

    -- Purga oportunista de salas viejas (>24h sin actividad).
    IF random() < 0.1 THEN
        DELETE FROM public.orbita_rooms
        WHERE updated_at < now() - interval '24 hours';
    END IF;

    -- Higiene: el anfitrión solo sostiene UNA sala viva a la vez.
    UPDATE public.orbita_rooms
    SET status = 'closed', updated_at = now()
    WHERE host_clerk_id = p_clerk_user_id AND status IN ('lobby', 'play');

    -- Código de 4 dígitos único entre las salas vivas recientes.
    LOOP
        v_try := v_try + 1;
        v_code := (1000 + floor(random() * 9000))::int::text;
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.orbita_rooms
            WHERE code = v_code
              AND status IN ('lobby', 'play')
              AND updated_at > now() - interval '6 hours'
        ) OR v_try >= 25;
    END LOOP;

    INSERT INTO public.orbita_rooms (code, host_clerk_id, players)
    VALUES (
        v_code,
        p_clerk_user_id,
        jsonb_build_array(jsonb_build_object('cid', p_clerk_user_id, 'name', v_name))
    )
    RETURNING * INTO v_row;

    RETURN public._orbita_room_json(v_row);
END $$;

-- ── Unirse por código (gratis para cualquier Tripulante identificado) ──
CREATE OR REPLACE FUNCTION public.join_orbita_room(
    p_clerk_user_id text,
    p_code          text,
    p_name          text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name text := LEFT(TRIM(COALESCE(p_name, '')), 18);
    v_row  public.orbita_rooms;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF length(v_name) = 0 THEN v_name := 'Nodo'; END IF;

    SELECT * INTO v_row
    FROM public.orbita_rooms
    WHERE code = TRIM(COALESCE(p_code, ''))
      AND status IN ('lobby', 'play')
      AND updated_at > now() - interval '6 hours'
    ORDER BY updated_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    -- Reconexión: si ya es jugador, refresca su nombre y devuelve la sala.
    IF public._orbita_is_player(v_row, p_clerk_user_id) THEN
        UPDATE public.orbita_rooms SET
            players = (
                SELECT COALESCE(jsonb_agg(
                    CASE WHEN e->>'cid' = p_clerk_user_id
                         THEN jsonb_build_object('cid', p_clerk_user_id, 'name', v_name)
                         ELSE e END
                ), '[]'::jsonb)
                FROM jsonb_array_elements(v_row.players) e
            ),
            updated_at = now()
        WHERE id = v_row.id
        RETURNING * INTO v_row;
        RETURN public._orbita_room_json(v_row);
    END IF;

    IF v_row.status <> 'lobby' THEN
        RETURN json_build_object('error', 'started');
    END IF;
    IF jsonb_array_length(v_row.players) >= 12 THEN
        RETURN json_build_object('error', 'full');
    END IF;

    UPDATE public.orbita_rooms SET
        players = v_row.players || jsonb_build_array(
            jsonb_build_object('cid', p_clerk_user_id, 'name', v_name)
        ),
        updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;

    RETURN public._orbita_room_json(v_row);
END $$;

-- ── Leer la sala (solo jugadores de la sala) ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_orbita_room(
    p_clerk_user_id text,
    p_room_id       uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.orbita_rooms;
BEGIN
    SELECT * INTO v_row FROM public.orbita_rooms WHERE id = p_room_id;
    IF NOT FOUND OR NOT public._orbita_is_player(v_row, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN public._orbita_room_json(v_row);
END $$;

-- ── Acciones de sala: start / state / leave / close ──────────────────
-- start (solo anfitrión): estado inicial del juego → status 'play'.
-- state (cualquier jugador, sala en 'play'): reemplaza el estado con guard
--   optimista base_rev (dos mutaciones cruzadas → 'stale' → el cliente
--   re-lee; el juego es social entre presentes, la DB solo coordina).
-- leave: sale de la sala (si sale el anfitrión, la sala se cierra).
-- close (solo anfitrión): cierra la sala para todos.
CREATE OR REPLACE FUNCTION public.orbita_room_action(
    p_clerk_user_id text,
    p_room_id       uuid,
    p_action        text,
    p_payload       jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row  public.orbita_rooms;
    v_base int;
    v_new  jsonb;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT * INTO v_row FROM public.orbita_rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF NOT FOUND OR NOT public._orbita_is_player(v_row, p_clerk_user_id) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    IF p_action = 'start' THEN
        IF v_row.host_clerk_id <> p_clerk_user_id THEN
            RETURN json_build_object('error', 'not_host');
        END IF;
        IF v_row.status <> 'lobby' THEN
            RETURN json_build_object('error', 'started');
        END IF;
        IF jsonb_array_length(v_row.players) < 2 THEN
            RETURN json_build_object('error', 'need_players');
        END IF;
        UPDATE public.orbita_rooms SET
            status = 'play',
            state = COALESCE(p_payload->'state', '{}'::jsonb),
            updated_at = now()
        WHERE id = v_row.id
        RETURNING * INTO v_row;
        RETURN public._orbita_room_json(v_row);

    ELSIF p_action = 'state' THEN
        IF v_row.status <> 'play' THEN
            RETURN json_build_object('error', 'not_playing');
        END IF;
        v_base := COALESCE((v_row.state->>'rev')::int, 0);
        IF COALESCE((p_payload->>'base_rev')::int, -1) <> v_base THEN
            RETURN json_build_object('error', 'stale');
        END IF;
        v_new := COALESCE(p_payload->'state', '{}'::jsonb);
        UPDATE public.orbita_rooms SET
            state = v_new,
            status = CASE
                WHEN COALESCE((v_new->>'done')::boolean, false) THEN 'done'
                ELSE status
            END,
            updated_at = now()
        WHERE id = v_row.id
        RETURNING * INTO v_row;
        RETURN public._orbita_room_json(v_row);

    ELSIF p_action = 'leave' THEN
        IF v_row.host_clerk_id = p_clerk_user_id THEN
            UPDATE public.orbita_rooms SET
                status = 'closed', updated_at = now()
            WHERE id = v_row.id
            RETURNING * INTO v_row;
        ELSE
            UPDATE public.orbita_rooms SET
                players = (
                    SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
                    FROM jsonb_array_elements(v_row.players) e
                    WHERE e->>'cid' <> p_clerk_user_id
                ),
                updated_at = now()
            WHERE id = v_row.id
            RETURNING * INTO v_row;
        END IF;
        RETURN public._orbita_room_json(v_row);

    ELSIF p_action = 'close' THEN
        IF v_row.host_clerk_id <> p_clerk_user_id THEN
            RETURN json_build_object('error', 'not_host');
        END IF;
        UPDATE public.orbita_rooms SET
            status = 'closed', updated_at = now()
        WHERE id = v_row.id
        RETURNING * INTO v_row;
        RETURN public._orbita_room_json(v_row);
    END IF;

    RETURN json_build_object('error', 'unknown_action');
END $$;

-- ── Locks (patrón canónico: nada para anon/authenticated; gateway only) ──
REVOKE ALL ON FUNCTION public._orbita_room_json(public.orbita_rooms)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._orbita_is_player(public.orbita_rooms, text)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_orbita_room(text, text)                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_orbita_room(text, text, text)                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_orbita_room(text, uuid)                         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.orbita_room_action(text, uuid, text, jsonb)         FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._orbita_room_json(public.orbita_rooms)           TO service_role;
GRANT EXECUTE ON FUNCTION public._orbita_is_player(public.orbita_rooms, text)     TO service_role;
GRANT EXECUTE ON FUNCTION public.create_orbita_room(text, text)                   TO service_role;
GRANT EXECUTE ON FUNCTION public.join_orbita_room(text, text, text)               TO service_role;
GRANT EXECUTE ON FUNCTION public.get_orbita_room(text, uuid)                      TO service_role;
GRANT EXECUTE ON FUNCTION public.orbita_room_action(text, uuid, text, jsonb)      TO service_role;

NOTIFY pgrst, 'reload schema';
