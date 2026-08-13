-- Red Solar Viva · Ritual PERSONALIZADO del Sendero de Luz
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El Tripulante (Sintonía Solar) escribe su propia rutina y la activa como un
-- ritual más del Sendero, que rinde Fotones al cumplirlo. Diseño de menor riesgo:
--   · UN slot fijo 'personalizado' en daily_ritual_catalog → toggle_ritual y
--     get_ritual_diario funcionan SIN cambios (lo trata como cualquier ritual).
--   · La ETIQUETA de la rutina vive por-usuario en ritual_personalizado; el
--     cliente la sobrepone y solo muestra el slot a miembros que ya escribieron
--     su rutina (gating client-side, igual que Afirmaciones).

-- ── Slot en el catálogo (puntos editables luego desde Motor → Rituales) ──
INSERT INTO public.daily_ritual_catalog (activity_key, label, points, requires_text, active, sort_order)
VALUES ('personalizado', 'Personalizado', 10, false, true, 90)
ON CONFLICT (activity_key) DO NOTHING;

-- ── Rutina por-usuario ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ritual_personalizado (
    clerk_user_id text PRIMARY KEY,
    label         text NOT NULL DEFAULT '',
    updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ritual_personalizado ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER + service_role.)

-- ── Leer la rutina (usuario; id inyectado por user-action) ───────────
CREATE OR REPLACE FUNCTION public.get_ritual_personalizado(
    p_clerk_user_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lbl text := '';
BEGIN
    IF p_clerk_user_id IS NULL OR length(p_clerk_user_id) < 3 THEN
        RETURN json_build_object('label', '');
    END IF;
    SELECT label INTO lbl FROM ritual_personalizado WHERE clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('label', COALESCE(lbl, ''));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_ritual_personalizado(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_ritual_personalizado(text) TO service_role;

-- ── Guardar / limpiar la rutina (usuario) ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_ritual_personalizado(
    p_clerk_user_id text,
    p_label         text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lbl text := LEFT(TRIM(COALESCE(p_label, '')), 80);
BEGIN
    IF p_clerk_user_id IS NULL OR length(p_clerk_user_id) < 3 THEN
        RAISE EXCEPTION 'clerk_user_id required';
    END IF;
    IF length(lbl) = 0 THEN
        -- Vacío = limpiar la rutina (el slot deja de mostrarse).
        DELETE FROM ritual_personalizado WHERE clerk_user_id = p_clerk_user_id;
        RETURN json_build_object('label', '');
    END IF;
    INSERT INTO ritual_personalizado (clerk_user_id, label, updated_at)
    VALUES (p_clerk_user_id, lbl, now())
    ON CONFLICT (clerk_user_id)
    DO UPDATE SET label = EXCLUDED.label, updated_at = now();
    RETURN json_build_object('label', lbl);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_ritual_personalizado(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_ritual_personalizado(text, text) TO service_role;
