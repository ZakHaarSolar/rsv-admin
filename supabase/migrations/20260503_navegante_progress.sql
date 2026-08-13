-- 20260503_navegante_progress.sql
-- Persistencia del progreso por tripulante en Navegantes de la Red.
-- Una fila por (tripulante, membrana). Se accede solo vía RPCs SECURITY
-- DEFINER (la tabla queda con RLS activo y sin policies — bloqueada).
--
-- Pegar este archivo en Supabase Dashboard → SQL Editor → New Query → Run.

-- ── Tabla ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.navegante_progress (
    clerk_user_id text NOT NULL,
    level_id      integer NOT NULL,
    completed     boolean NOT NULL DEFAULT false,
    time_ms       integer,
    preview       text,
    chord         boolean NOT NULL DEFAULT false,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, level_id)
);

ALTER TABLE public.navegante_progress ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ── RPC: leer todo el progreso de un tripulante ───────────────────────
-- Devuelve un objeto JSON con shape:
--   { "1": {completed, timeMs, preview, chord}, "2": {...}, ... }
-- Lo consume directo el cliente para hidratar el state del LevelConsole.
CREATE OR REPLACE FUNCTION public.get_navegante_progress(p_clerk_id text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        jsonb_object_agg(
            level_id::text,
            jsonb_strip_nulls(
                jsonb_build_object(
                    'completed', completed,
                    'timeMs',    time_ms,
                    'preview',   preview,
                    'chord',     chord
                )
            )
        ),
        '{}'::jsonb
    )
    FROM public.navegante_progress
    WHERE clerk_user_id = p_clerk_id;
$$;

-- ── RPC: guardar/actualizar el progreso de un nivel ───────────────────
-- Upsert idempotente. Los campos opcionales (time_ms, preview) preservan
-- el valor anterior si llegan NULL, así un save sin time_ms no borra el
-- mejor tiempo previo.
CREATE OR REPLACE FUNCTION public.save_navegante_level(
    p_clerk_id  text,
    p_level_id  integer,
    p_completed boolean,
    p_time_ms   integer DEFAULT NULL,
    p_preview   text    DEFAULT NULL,
    p_chord     boolean DEFAULT false
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.navegante_progress (
        clerk_user_id, level_id, completed, time_ms, preview, chord, updated_at
    ) VALUES (
        p_clerk_id, p_level_id, p_completed, p_time_ms, p_preview, p_chord, now()
    )
    ON CONFLICT (clerk_user_id, level_id)
    DO UPDATE SET
        completed  = EXCLUDED.completed OR public.navegante_progress.completed,
        time_ms    = COALESCE(EXCLUDED.time_ms, public.navegante_progress.time_ms),
        preview    = COALESCE(EXCLUDED.preview, public.navegante_progress.preview),
        chord      = EXCLUDED.chord OR public.navegante_progress.chord,
        updated_at = now();
$$;

-- ── RPC: limpiar todo el progreso de un tripulante (botón RESET) ──────
CREATE OR REPLACE FUNCTION public.clear_navegante_progress(p_clerk_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.navegante_progress WHERE clerk_user_id = p_clerk_id;
$$;

-- ── Permisos de invocación desde el cliente con anon key ──────────────
GRANT EXECUTE ON FUNCTION public.get_navegante_progress(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_navegante_level(text, integer, boolean, integer, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_navegante_progress(text) TO anon, authenticated;
