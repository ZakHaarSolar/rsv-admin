-- Red Solar Viva · CONTADOR DE RACHAS — historial de tramos (para la gráfica)
-- =====================================================================
-- 20260711_racha_history.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: EV_Rachas.tsx (gráfica de progreso en la consola del contador).
-- NO toca el gateway user-action: el historial viaja DENTRO del json que ya
-- devuelve get_my_rachas (vía _racha_to_json). Cero cambios de whitelist.
--
-- Qué agrega: hasta hoy, reiniciar una racha DESTRUÍA el tramo anterior
-- (started_at se sobreescribía con now(); solo sobrevivía best_seconds como
-- escalar). Ahora cada reinicio ARCHIVA el tramo que se cierra en la columna
-- jsonb `history` — un array de { s: inicio, e: fin, sec: duración } — para
-- que el Tripulante vea su cordillera de constancia (periodos sostenidos vs
-- reinicios seguidos) a lo largo del tiempo. El tramo VIVO se sigue derivando
-- de started_at; el récord (best_seconds) intacto = la línea de máximo.
--
-- Los reinicios YA ocurridos son irrecuperables (nunca se escribieron): la
-- gráfica arranca con el tramo vivo + la línea de récord y se enriquece con
-- cada ciclo nuevo. Cap de 300 tramos por racha (drop del más viejo).

-- ── 1) La columna de historial ──────────────────────────────────────
ALTER TABLE public.rachas
    ADD COLUMN IF NOT EXISTS history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── 2) Helper fila → json: ahora expone `history` ───────────────────
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
        'history',      COALESCE(r.history, '[]'::jsonb)
    );
$$;

-- ── 3) Reiniciar: ARCHIVA el tramo cerrado antes de poner el reloj a cero ──
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

    v_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (now() - v_old.started_at)))::bigint;
    v_hist    := COALESCE(v_old.history, '[]'::jsonb);

    -- Solo archivamos tramos con vida real (evita basura de resets instantáneos).
    IF v_elapsed > 0 THEN
        v_hist := v_hist || jsonb_build_object(
            's',   v_old.started_at,
            'e',   now(),
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
        updated_at   = now()
    WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── 4) Re-afirmar locks (patrón canónico: gateway-only) ─────────────
REVOKE ALL ON FUNCTION public._racha_to_json(public.rachas)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_racha(text, uuid)        FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._racha_to_json(public.rachas) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_racha(text, uuid)       TO service_role;

NOTIFY pgrst, 'reload schema';
