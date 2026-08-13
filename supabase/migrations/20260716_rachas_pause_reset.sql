-- 20260716_rachas_pause_reset.sql — PAUSA = REINICIO + STANDBY (feedback de Zak).
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: EV_Rachas.tsx v1.6 (confirmador de pausa). NO toca el gateway:
-- `toggle_racha_pause` ya está en el whitelist de user-action v1.39.
--
-- QUÉ CAMBIA (revierte la semántica de 20260715_rachas_pause):
-- Antes, pausar CONGELABA el conteo y al reanudar seguía donde quedó (los
-- días vivos se preservaban). Zak definió lo contrario: si el Tripulante va a
-- pausar, es porque NO va a sostener el hábito esos días, así que la racha se
-- rompe con honestidad. Ahora:
--
--   PAUSAR   = archiva el tramo vivo en `history` (para la gráfica) + sube el
--              récord si aplica + conteo A CERO + queda en standby.
--   REANUDAR = arranca de cero desde el momento de retomarla.
--
-- Mientras está en pausa NO se cuentan días: started_at y paused_at quedan en
-- el MISMO instante, así el conteo efectivo del cliente (effNowMs → paused_at)
-- da exactamente 0 y se mantiene congelado ahí. El récord (best_seconds) SIEMPRE
-- se conserva, igual que en un reinicio normal.
--
-- Idempotente / re-ejecutable (CREATE OR REPLACE). `reset_racha` NO se toca:
-- su guarda `COALESCE(paused_at, now())` ya deja un reinicio-estando-en-pausa
-- como "arranca de cero y queda activa", que es justo lo esperado.

-- ── Pausar (reinicia + standby) / Reanudar (arranca de cero) ─────────
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

    IF v_old.paused_at IS NULL THEN
        -- ── PAUSAR: cierra el tramo vivo, lo archiva, conteo a cero, standby.
        v_elapsed := GREATEST(
            0,
            EXTRACT(EPOCH FROM (now() - v_old.started_at))
        )::bigint;
        v_hist := COALESCE(v_old.history, '[]'::jsonb);

        -- Solo archivamos tramos con vida real (evita basura de pausas instantáneas).
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

        -- started_at = paused_at = now() → el conteo efectivo queda en 0 y
        -- congelado ahí mientras dure la pausa (no acumula días).
        UPDATE public.rachas SET
            best_seconds = GREATEST(best_seconds, v_elapsed),
            history      = v_hist,
            started_at   = now(),
            paused_at    = now(),
            updated_at   = now()
        WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
    ELSE
        -- ── REANUDAR: arranca de cero desde este instante.
        UPDATE public.rachas SET
            started_at = now(),
            paused_at  = NULL,
            updated_at = now()
        WHERE id = p_racha_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
    END IF;

    RETURN json_build_object('ok', true, 'racha', public._racha_to_json(v_row));
END $$;

-- ── Re-afirmar locks (patrón canónico: gateway-only) ────────────────
REVOKE ALL ON FUNCTION public.toggle_racha_pause(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_racha_pause(text, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
