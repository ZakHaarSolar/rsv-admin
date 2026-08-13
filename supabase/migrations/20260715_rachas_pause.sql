-- 20260715_rachas_pause.sql — PAUSA de rachas (feedback de Zak): el Tripulante
-- puede DESACTIVAR una racha unos días (viaje, enfermedad, honestidad de que no
-- la va a sostener) sin perderla ni reiniciarla; al REACTIVARLA el conteo sigue
-- justo donde lo dejó. Mecánica: columna paused_at (NULL = activa). Al pausar se
-- congela el conteo en ese instante; al reanudar se corre started_at hacia
-- adelante por el tiempo pausado → los días vivos se preservan y la pausa no
-- cuenta. Idempotente / re-ejecutable (CREATE OR REPLACE + ADD COLUMN IF NOT
-- EXISTS). Pareja: user-action (suma toggle_racha_pause al whitelist) + redeploy.

-- ── 1) Columna de pausa ─────────────────────────────────────────────
ALTER TABLE public.rachas
    ADD COLUMN IF NOT EXISTS paused_at timestamptz DEFAULT NULL;

-- ── 2) Helper fila → json: ahora expone `paused_at` ────────────────
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
        'created_at',   r.created_at,
        'history',      COALESCE(r.history, '[]'::jsonb),
        'paused_at',    r.paused_at
    );
$$;

-- ── 3) Pausar / reanudar (toggle; reversible, sin confirmación) ──────
CREATE OR REPLACE FUNCTION public.toggle_racha_pause(
    p_clerk_user_id text,
    p_racha_id      uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old public.rachas;
    v_row public.rachas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT * INTO v_old
    FROM public.rachas
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    IF v_old.paused_at IS NULL THEN
        -- Pausar: congela el conteo en este instante.
        UPDATE public.rachas SET
            paused_at  = now(),
            updated_at = now()
        WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
    ELSE
        -- Reanudar: corre el inicio por el tiempo pausado (preserva los días).
        UPDATE public.rachas SET
            started_at = v_old.started_at + (now() - v_old.paused_at),
            paused_at  = NULL,
            updated_at = now()
        WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
    END IF;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── 4) Reiniciar: respeta la pausa (archiva hasta paused_at) y deja la
--       racha nueva ACTIVA (fiel a 20260711_racha_history + guarda de pausa) ──
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
    v_old     public.rachas;
    v_end     timestamptz;
    v_elapsed bigint;
    v_hist    jsonb;
    v_row     public.rachas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT * INTO v_old
    FROM public.rachas
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    -- Si estaba pausada, el tramo se cierra en paused_at (no cuenta la pausa).
    v_end     := COALESCE(v_old.paused_at, now());
    v_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (v_end - v_old.started_at)))::bigint;
    v_hist    := COALESCE(v_old.history, '[]'::jsonb);

    -- Solo archivamos tramos con vida real (evita basura de resets instantáneos).
    IF v_elapsed > 0 THEN
        v_hist := v_hist || jsonb_build_object(
            's',   v_old.started_at,
            'e',   v_end,
            'sec', v_elapsed
        );
        -- Cap: conservar los 300 tramos más recientes.
        WHILE jsonb_array_length(v_hist) > 300 LOOP
            v_hist := v_hist - 0;
        END LOOP;
    END IF;

    UPDATE public.rachas SET
        best_seconds = GREATEST(best_seconds, v_elapsed),
        history      = v_hist,
        started_at   = now(),
        paused_at    = NULL,
        updated_at   = now()
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── 5) Re-afirmar locks (patrón canónico: gateway-only) ─────────────
REVOKE ALL ON FUNCTION public._racha_to_json(public.rachas)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_racha_pause(text, uuid)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_racha(text, uuid)         FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._racha_to_json(public.rachas)  TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_racha_pause(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_racha(text, uuid)        TO service_role;

NOTIFY pgrst, 'reload schema';
