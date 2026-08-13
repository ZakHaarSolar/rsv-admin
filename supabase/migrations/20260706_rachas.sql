-- Red Solar Viva · CONTADOR DE RACHAS — hábitos pasivos medidos en automático
-- =====================================================================
-- 20260706_rachas.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action v1.31 (suma get_my_rachas / create_racha / reset_racha /
-- update_racha / delete_racha al whitelist) + EV_Rachas.tsx v1.0 (capa del
-- Radar en escaner-app).
--
-- Qué es: el Tripulante SELLA un contador (título + fecha/hora de inicio) y el
-- campo cuenta solo — cero palomita diaria (ideal para hábitos pasivos: cero
-- azúcar, cero gluten, sin aceites industriales…). Reiniciar es observación
-- sin juicio: la cuenta vuelve a cero y el récord (best_seconds) se conserva.
--
-- Freemium (server-side, la verdad vive aquí; el cliente solo pre-gatea la UI):
--   · SIN membresía → 1 contador.
--   · Con membresía activa (Sintonía/Inmersión, mismo criterio que
--     _is_active_member de 20260625e_dm_stickers.sql) → hasta 30.
--
-- Tabla RLS-locked SIN policies → solo accesible vía las RPCs SECURITY
-- DEFINER de abajo, ruteadas por el gateway user-action (que inyecta el
-- p_clerk_user_id verificado del token; el del cliente se descarta).

CREATE TABLE IF NOT EXISTS public.rachas (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    title         text NOT NULL,
    started_at    timestamptz NOT NULL DEFAULT now(),
    best_seconds  bigint NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rachas_user ON public.rachas (clerk_user_id);

ALTER TABLE public.rachas ENABLE ROW LEVEL SECURITY;
-- (Sin policies → cero acceso anon/authenticated; solo service_role vía RPC.)

-- ── Helper interno: fila → json (una sola forma en todas las RPCs) ──
CREATE OR REPLACE FUNCTION public._racha_to_json(r public.rachas)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',           r.id,
        'title',        r.title,
        'started_at',   r.started_at,
        'best_seconds', r.best_seconds,
        'created_at',   r.created_at
    );
$$;

-- ── Lectura: mis contadores + membresía (gatea el "+" en la UI) ──────
CREATE OR REPLACE FUNCTION public.get_my_rachas(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member boolean;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    v_member := public._is_active_member(p_clerk_user_id);
    RETURN json_build_object(
        'is_member',  v_member,
        'free_limit', 1,
        'max_total',  30,
        'rachas', COALESCE((
            SELECT json_agg(public._racha_to_json(r) ORDER BY r.created_at)
            FROM public.rachas r
            WHERE r.clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    );
END $$;

-- ── Sellar un contador nuevo (aplica el límite freemium) ────────────
CREATE OR REPLACE FUNCTION public.create_racha(
    p_clerk_user_id text,
    p_title         text,
    p_started_at    timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_title   text := LEFT(TRIM(COALESCE(p_title, '')), 60);
    -- Clamp: nunca en el futuro (si mandan mañana, arranca ahora).
    v_started timestamptz := LEAST(COALESCE(p_started_at, now()), now());
    v_count   int;
    v_member  boolean;
    v_row     public.rachas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF length(v_title) = 0 THEN
        RETURN json_build_object('error', 'invalid_title');
    END IF;

    SELECT count(*)::int INTO v_count
    FROM public.rachas WHERE clerk_user_id = p_clerk_user_id;

    v_member := public._is_active_member(p_clerk_user_id);

    IF NOT v_member AND v_count >= 1 THEN
        RETURN json_build_object('error', 'limit_free');
    END IF;
    IF v_count >= 30 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    INSERT INTO public.rachas (clerk_user_id, title, started_at)
    VALUES (p_clerk_user_id, v_title, v_started)
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── Reiniciar (observación sin juicio): cuenta a cero, récord se queda ──
CREATE OR REPLACE FUNCTION public.reset_racha(
    p_clerk_user_id text,
    p_racha_id      uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.rachas;
BEGIN
    UPDATE public.rachas SET
        best_seconds = GREATEST(
            best_seconds,
            GREATEST(0, EXTRACT(EPOCH FROM (now() - started_at)))::bigint
        ),
        started_at = now(),
        updated_at = now()
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── Ajustar título y/o fecha de inicio (no toca el récord) ──────────
CREATE OR REPLACE FUNCTION public.update_racha(
    p_clerk_user_id text,
    p_racha_id      uuid,
    p_title         text DEFAULT NULL,
    p_started_at    timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.rachas;
BEGIN
    UPDATE public.rachas SET
        title = COALESCE(NULLIF(LEFT(TRIM(COALESCE(p_title, '')), 60), ''), title),
        started_at = LEAST(COALESCE(p_started_at, started_at), now()),
        updated_at = now()
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;
    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── Eliminar un contador ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_racha(
    p_clerk_user_id text,
    p_racha_id      uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted boolean;
BEGIN
    DELETE FROM public.rachas
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id;
    v_deleted := FOUND;
    RETURN json_build_object('ok', true, 'deleted', v_deleted);
END $$;

-- ── Locks (patrón canónico: nada para anon/authenticated; gateway only) ──
REVOKE ALL ON FUNCTION public._racha_to_json(public.rachas)                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_rachas(text)                              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_racha(text, text, timestamptz)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_racha(text, uuid)                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_racha(text, uuid, text, timestamptz)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_racha(text, uuid)                         FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._racha_to_json(public.rachas)                 TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_rachas(text)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.create_racha(text, text, timestamptz)         TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_racha(text, uuid)                       TO service_role;
GRANT EXECUTE ON FUNCTION public.update_racha(text, uuid, text, timestamptz)   TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_racha(text, uuid)                      TO service_role;

NOTIFY pgrst, 'reload schema';
