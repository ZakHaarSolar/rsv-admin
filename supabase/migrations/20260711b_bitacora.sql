-- Red Solar Viva · BITÁCORA DE COHERENCIA — capa de notas del Escáner
-- =====================================================================
-- 20260711b_bitacora.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: user-action (suma get_my_notas / upsert_nota / delete_nota al
-- whitelist) + EV_Bitacora.tsx (capa nueva del Radar en escaner-app).
--
-- Qué es: un cuaderno holográfico dentro del Escáner (título + cuerpo en
-- Markdown simple + etiqueta + anclado/favorito). Auto-guardado en tiempo
-- real. Compite con Evernote desde la estética de la app.
--
-- Freemium (server-side, la verdad vive aquí; el cliente solo pre-gatea):
--   · SIN membresía → hasta 5 notas.
--   · Con Sintonía/Inmersión activa (_is_active_member) → hasta 1000
--     (efectivamente ilimitado; el tope evita abusos).
--
-- Tabla RLS-locked SIN policies → solo accesible vía las RPCs SECURITY
-- DEFINER, ruteadas por el gateway user-action (inyecta el p_clerk_user_id
-- verificado del token; el del cliente se descarta).

CREATE TABLE IF NOT EXISTS public.bitacora_notas (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    title         text NOT NULL DEFAULT '',
    body          text NOT NULL DEFAULT '',
    tag           text NOT NULL DEFAULT 'revelaciones',
    pinned        boolean NOT NULL DEFAULT false,
    favorite      boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bitacora_user ON public.bitacora_notas (clerk_user_id);

ALTER TABLE public.bitacora_notas ENABLE ROW LEVEL SECURITY;
-- (Sin policies → cero acceso anon/authenticated; solo service_role vía RPC.)

-- ── Helper interno: fila → json (una sola forma en todas las RPCs) ──
CREATE OR REPLACE FUNCTION public._nota_to_json(n public.bitacora_notas)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        'id',         n.id,
        'title',      n.title,
        'body',       n.body,
        'tag',        n.tag,
        'pinned',     n.pinned,
        'favorite',   n.favorite,
        'created_at', n.created_at,
        'updated_at', n.updated_at
    );
$$;

-- ── Lectura: mis notas + membresía (gatea el "+" en la UI) ──────────
CREATE OR REPLACE FUNCTION public.get_my_notas(p_clerk_user_id text)
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
        'free_limit', 5,
        'max_total',  1000,
        'notas', COALESCE((
            SELECT json_agg(public._nota_to_json(n)
                            ORDER BY n.pinned DESC, n.updated_at DESC)
            FROM public.bitacora_notas n
            WHERE n.clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    );
END $$;

-- ── Crear/actualizar una nota (auto-guardado + flags) ───────────────
-- p_id NULL o inexistente → INSERT (aplica el límite freemium).
-- p_id existente → UPDATE (título/cuerpo/etiqueta/anclado/favorito).
CREATE OR REPLACE FUNCTION public.upsert_nota(
    p_clerk_user_id text,
    p_id            uuid,
    p_title         text,
    p_body          text,
    p_tag           text,
    p_pinned        boolean DEFAULT false,
    p_favorite      boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_title  text := LEFT(COALESCE(p_title, ''), 200);
    v_body   text := LEFT(COALESCE(p_body, ''), 20000);
    v_tag    text := LEFT(COALESCE(NULLIF(TRIM(p_tag), ''), 'revelaciones'), 40);
    v_count  int;
    v_member boolean;
    v_exists boolean := false;
    v_row    public.bitacora_notas;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_id IS NOT NULL THEN
        SELECT true INTO v_exists
        FROM public.bitacora_notas
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    END IF;

    IF v_exists THEN
        UPDATE public.bitacora_notas SET
            title = v_title,
            body = v_body,
            tag = v_tag,
            pinned = COALESCE(p_pinned, false),
            favorite = COALESCE(p_favorite, false),
            updated_at = now()
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO v_row;
        RETURN json_build_object('ok', true, 'nota', public._nota_to_json(v_row));
    END IF;

    -- INSERT: aplica el límite freemium.
    SELECT count(*)::int INTO v_count
    FROM public.bitacora_notas WHERE clerk_user_id = p_clerk_user_id;

    v_member := public._is_active_member(p_clerk_user_id);

    IF NOT v_member AND v_count >= 5 THEN
        RETURN json_build_object('error', 'limit_free');
    END IF;
    IF v_count >= 1000 THEN
        RETURN json_build_object('error', 'limit_max');
    END IF;

    INSERT INTO public.bitacora_notas
        (clerk_user_id, title, body, tag, pinned, favorite)
    VALUES
        (p_clerk_user_id, v_title, v_body, v_tag,
         COALESCE(p_pinned, false), COALESCE(p_favorite, false))
    RETURNING * INTO v_row;

    RETURN json_build_object('ok', true, 'nota', public._nota_to_json(v_row));
END $$;

-- ── Eliminar una nota ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_nota(
    p_clerk_user_id text,
    p_id            uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted boolean;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM public.bitacora_notas
    WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    v_deleted := FOUND;
    RETURN json_build_object('ok', true, 'deleted', v_deleted);
END $$;

-- ── Locks (patrón canónico: nada para anon/authenticated; gateway only) ──
REVOKE ALL ON FUNCTION public._nota_to_json(public.bitacora_notas)                             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_notas(text)                                              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_nota(text, uuid, text, text, text, boolean, boolean)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_nota(text, uuid)                                         FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._nota_to_json(public.bitacora_notas)                          TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_notas(text)                                            TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_nota(text, uuid, text, text, text, boolean, boolean)   TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_nota(text, uuid)                                        TO service_role;

NOTIFY pgrst, 'reload schema';
