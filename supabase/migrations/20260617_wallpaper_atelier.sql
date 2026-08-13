-- 20260617_wallpaper_atelier.sql
-- Motor de Intervención · Atelier de Wallpapers — generador de PROMPTS de
-- wallpapers (modo solo-prompts, 1 a 1). Guarda los prompts generados para que
-- el admin los pegue en Nano Banana. NO es la galería de wallpapers de la app
-- (esa es la tabla `wallpapers`); aquí solo viven los prompts del generador.
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS public.wallpaper_prompts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key text NOT NULL,         -- colectivos | lineas_temporales | ...
    category_label text,                -- etiqueta legible de la categoría
    title text,                         -- título corto para identificar
    prompt text NOT NULL,               -- el prompt para Nano Banana (inglés)
    colectivo_name text,                -- si se protagonizó un colectivo guardado
    generated_by_clerk_id text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallpaper_prompts_created
    ON public.wallpaper_prompts(created_at DESC);

-- Lockdown: sin policies → acceso solo por RPCs SECURITY DEFINER (admin) o
-- service_role (el edge generate-wallpaper-prompt inserta con service_role).
ALTER TABLE public.wallpaper_prompts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallpaper_prompts FROM anon, authenticated;

-- ── RPC: lista (admin) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_wallpaper_prompts_admin(
    p_admin_clerk_id text,
    p_limit int DEFAULT 60
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(sub) ORDER BY sub.created_at DESC)
    INTO v_result
    FROM (
        SELECT id, category_key, category_label, title, prompt,
               colectivo_name, created_at
        FROM public.wallpaper_prompts
        ORDER BY created_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) sub;

    RETURN json_build_object('prompts', COALESCE(v_result, '[]'::json));
END $$;

-- ── RPC: borrar (admin) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_wallpaper_prompt(
    p_admin_clerk_id text,
    p_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    DELETE FROM public.wallpaper_prompts WHERE id = p_id;
    RETURN json_build_object('success', true);
END $$;

REVOKE ALL ON FUNCTION public.get_wallpaper_prompts_admin(text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_wallpaper_prompt(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallpaper_prompts_admin(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_wallpaper_prompt(text, uuid) TO service_role;
