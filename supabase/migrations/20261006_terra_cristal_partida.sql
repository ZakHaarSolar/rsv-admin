-- 20261006_terra_cristal_partida.sql
-- Terra Cristal (Ludus Cero, play.redsolarviva.com/terra-cristal-pixel3/): la partida del juego en la cuenta del
-- Tripulante (la misma del Escáner). UNA sola partida por cuenta, como en Shining Force: un documento con su versión (el
-- avatar sellado, los fotones de luz, lo que ganó cada tripulante, la forja, los brotes, lo que ya pasó en la historia).
-- El juego guarda primero en el aparato y copia aquí cuando hay sesión; al cargar gana el más nuevo.
-- Se accede SOLO por el gateway user-action (el id del Tripulante lo inyecta el gateway desde el token verificado):
-- la tabla queda con RLS activo y sin policies, y las RPC son SECURITY DEFINER y solo las ejecuta service_role.
--
-- Pega este archivo en Supabase Dashboard → SQL Editor → New Query → Run.

-- ── Tabla ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.terra_cristal_partidas (
    clerk_user_id text PRIMARY KEY,
    documento     jsonb NOT NULL,
    version       integer NOT NULL DEFAULT 1,
    -- cuándo se guardó en el juego (lo dice el documento); manda el más nuevo
    guardada      timestamptz NOT NULL,
    creada        timestamptz NOT NULL DEFAULT now(),
    actualizada   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.terra_cristal_partidas ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPC SECURITY DEFINER de abajo.)

-- ── RPC: leer la partida del Tripulante (null si no tiene) ────────────
CREATE OR REPLACE FUNCTION public.get_terra_cristal_partida(p_clerk_id text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT documento FROM public.terra_cristal_partidas WHERE clerk_user_id = p_clerk_id;
$$;

-- ── RPC: guardar la partida ───────────────────────────────────────────
-- Upsert. Una partida más vieja NUNCA pisa a una más nueva (dos aparatos con la misma cuenta): se compara el
-- `guardada` que trae el documento. Devuelve { ok, guardada } con la que quedó.
CREATE OR REPLACE FUNCTION public.save_terra_cristal_partida(p_clerk_id text, p_documento jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_guardada timestamptz;
    v_version  integer;
    v_queda    timestamptz;
BEGIN
    IF p_clerk_id IS NULL OR p_documento IS NULL OR jsonb_typeof(p_documento) <> 'object' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'documento_invalido');
    END IF;
    -- (un documento de más de 256 KB no es una partida)
    IF length(p_documento::text) > 262144 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'documento_grande');
    END IF;
    v_guardada := COALESCE((p_documento->>'guardada')::timestamptz, now());
    v_version := COALESCE((p_documento->>'version')::integer, 1);

    INSERT INTO public.terra_cristal_partidas AS t (clerk_user_id, documento, version, guardada, actualizada)
    VALUES (p_clerk_id, p_documento, v_version, v_guardada, now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET documento   = EXCLUDED.documento,
            version     = EXCLUDED.version,
            guardada    = EXCLUDED.guardada,
            actualizada = now()
        WHERE t.guardada <= EXCLUDED.guardada;

    SELECT guardada INTO v_queda FROM public.terra_cristal_partidas WHERE clerk_user_id = p_clerk_id;
    RETURN jsonb_build_object('ok', true, 'guardada', v_queda);
END;
$$;

-- ── RPC: borrar la partida (NUEVO ENLACE) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_terra_cristal_partida(p_clerk_id text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH borrada AS (DELETE FROM public.terra_cristal_partidas WHERE clerk_user_id = p_clerk_id RETURNING 1)
    SELECT jsonb_build_object('ok', true, 'borradas', (SELECT count(*) FROM borrada));
$$;

-- ── Permisos: solo service_role (el gateway user-action) ──────────────
REVOKE ALL ON TABLE public.terra_cristal_partidas FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_terra_cristal_partida(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.save_terra_cristal_partida(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_terra_cristal_partida(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_terra_cristal_partida(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_terra_cristal_partida(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_terra_cristal_partida(text) TO service_role;
