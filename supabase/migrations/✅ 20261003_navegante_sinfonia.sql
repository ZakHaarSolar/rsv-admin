-- 20261003_navegante_sinfonia.sql
-- 🜂 SINFONÍA · Navegante de la Red guarda el mejor rango de cada membrana en la cuenta.
-- Cada membrana guarda su mejor rango por precisión (S, A, B, C), la precisión que lo dio y los
-- mejores puntos. El juego ya los guarda en el aparato (ndr_sinfonia_v1) y, mientras esta migración
-- no esté pegada, guarda el avance como siempre: nada se bloquea.
--
-- Mismo gateway, sin redeploy: save_navegante_level gana tres parámetros con DEFAULT (p_rango,
-- p_precision, p_puntos) y get_navegante_progress devuelve rango, precision y puntos.
-- La firma vieja se borra para que no queden dos funciones con el mismo nombre (PostgREST no sabría
-- cuál llamar) y los permisos quedan como en 20260608g: solo service_role (el gateway user-action).
--
-- Pegar este archivo en Supabase Dashboard → SQL Editor → New Query → Run.

-- ── Columnas ─────────────────────────────────────────────────────────────
ALTER TABLE public.navegante_progress
    ADD COLUMN IF NOT EXISTS sinfonia_rango text,
    ADD COLUMN IF NOT EXISTS sinfonia_precision smallint,
    ADD COLUMN IF NOT EXISTS sinfonia_puntos integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'navegante_progress_sinfonia_rango_chk'
    ) THEN
        ALTER TABLE public.navegante_progress
            ADD CONSTRAINT navegante_progress_sinfonia_rango_chk
            CHECK (sinfonia_rango IS NULL OR sinfonia_rango IN ('S', 'A', 'B', 'C'));
    END IF;
END $$;

-- ── Leer: el avance de cada membrana con su mejor rango ──────────────────
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
                    'chord',     chord,
                    'rango',     sinfonia_rango,
                    'precision', sinfonia_precision,
                    'puntos',    sinfonia_puntos
                )
            )
        ),
        '{}'::jsonb
    )
    FROM public.navegante_progress
    WHERE clerk_user_id = p_clerk_id;
$$;

-- ── Guardar: el rango solo sube (gana el de más precisión; los puntos, el mayor) ──
DROP FUNCTION IF EXISTS public.save_navegante_level(text, integer, boolean, integer, text, boolean);

CREATE OR REPLACE FUNCTION public.save_navegante_level(
    p_clerk_id    text,
    p_level_id    integer,
    p_completed   boolean,
    p_time_ms     integer DEFAULT NULL,
    p_preview     text    DEFAULT NULL,
    p_chord       boolean DEFAULT false,
    p_rango       text    DEFAULT NULL,
    p_precision   integer DEFAULT NULL,
    p_puntos      integer DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.navegante_progress (
        clerk_user_id, level_id, completed, time_ms, preview, chord,
        sinfonia_rango, sinfonia_precision, sinfonia_puntos, updated_at
    ) VALUES (
        p_clerk_id, p_level_id, p_completed, p_time_ms, p_preview, p_chord,
        CASE WHEN p_rango IN ('S', 'A', 'B', 'C') THEN p_rango END,
        CASE WHEN p_rango IN ('S', 'A', 'B', 'C') THEN LEAST(GREATEST(p_precision, 0), 100) END,
        CASE WHEN p_rango IN ('S', 'A', 'B', 'C') THEN GREATEST(p_puntos, 0) END,
        now()
    )
    ON CONFLICT (clerk_user_id, level_id)
    DO UPDATE SET
        completed  = EXCLUDED.completed OR public.navegante_progress.completed,
        time_ms    = COALESCE(EXCLUDED.time_ms, public.navegante_progress.time_ms),
        preview    = COALESCE(EXCLUDED.preview, public.navegante_progress.preview),
        chord      = EXCLUDED.chord OR public.navegante_progress.chord,
        sinfonia_rango = CASE
            WHEN EXCLUDED.sinfonia_rango IS NOT NULL
             AND (public.navegante_progress.sinfonia_precision IS NULL
                  OR EXCLUDED.sinfonia_precision > public.navegante_progress.sinfonia_precision)
            THEN EXCLUDED.sinfonia_rango
            ELSE public.navegante_progress.sinfonia_rango
        END,
        sinfonia_precision = CASE
            WHEN EXCLUDED.sinfonia_rango IS NOT NULL
             AND (public.navegante_progress.sinfonia_precision IS NULL
                  OR EXCLUDED.sinfonia_precision > public.navegante_progress.sinfonia_precision)
            THEN EXCLUDED.sinfonia_precision
            ELSE public.navegante_progress.sinfonia_precision
        END,
        sinfonia_puntos = CASE
            WHEN EXCLUDED.sinfonia_puntos IS NULL THEN public.navegante_progress.sinfonia_puntos
            ELSE GREATEST(EXCLUDED.sinfonia_puntos, COALESCE(public.navegante_progress.sinfonia_puntos, 0))
        END,
        updated_at = now();
$$;

-- ── Permisos: solo el gateway verificado (igual que 20260608g_tail_idor_revoke) ──
REVOKE EXECUTE ON FUNCTION public.get_navegante_progress(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_navegante_progress(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.save_navegante_level(text, integer, boolean, integer, text, boolean, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_navegante_level(text, integer, boolean, integer, text, boolean, text, integer, integer) TO service_role;

-- PostgREST recarga su mapa de funciones
NOTIFY pgrst, 'reload schema';
