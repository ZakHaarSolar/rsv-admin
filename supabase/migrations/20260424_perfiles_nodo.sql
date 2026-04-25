-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Perfiles de Nodo (2026-04-24)
--
-- Permite al Arquitecto:
--   1. Darle un nombre canónico a cada speaker detectado por Deepgram.
--      "Nodo · 2" → "Laura".
--   2. Marcar speakers residuales (ej. un ruido de fondo diarizado por
--      error) como eliminados para que no cuenten en la trayectoria.
--   3. Consolidar la presencia de un Nodo a través de múltiples sesiones,
--      acumulando una especie de "expediente" que luego alimenta al
--      Análisis Profundo para detectar patrones individuales.
--
--   Tabla `perfiles_nodo`       — catálogo de personas reales del campo.
--   Tabla `alias_nodos_sesion`  — puente (speaker_id ↔ perfil_id) por sesión.
--   Tabla `notas_nodo`          — observaciones libres del Arquitecto
--                                  (interferencias, trayectorias, próximos pasos).
--   RPCs SECURITY DEFINER para listar, upsertar y consultar cross-sesión.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. perfiles_nodo — catálogo canónico de personas
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfiles_nodo (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ancla  TEXT NOT NULL,
    /* Slug normalizado (sin mayúsculas, sin acentos, sin espacios) que
       sirve como identificador estable para deduplicar entradas. */
    slug          TEXT GENERATED ALWAYS AS (
        LOWER(
            REGEXP_REPLACE(
                TRANSLATE(TRIM(nombre_ancla),
                    'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñ',
                    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNn'
                ),
                '[^a-zA-Z0-9]+', '_', 'g'
            )
        )
    ) STORED,
    notas_admin   TEXT,
    avatar_color  TEXT,                    -- opcional: hex #RRGGBB para la UI
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_perfiles_nodo_slug ON public.perfiles_nodo (slug);
ALTER TABLE public.perfiles_nodo ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────
-- 2. alias_nodos_sesion — mapa speaker_id ↔ perfil_nodo por sesión
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alias_nodos_sesion (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sesion     TEXT NOT NULL,
    speaker_id    TEXT NOT NULL,      -- "speaker_0", "speaker_1", ...
    perfil_nodo_id UUID REFERENCES public.perfiles_nodo(id) ON DELETE SET NULL,
    eliminado     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_sesion, speaker_id)
);
CREATE INDEX IF NOT EXISTS idx_alias_perfil ON public.alias_nodos_sesion (perfil_nodo_id);
ALTER TABLE public.alias_nodos_sesion ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────
-- 3. notas_nodo — expediente libre (interferencias / trayectorias / próximos pasos)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notas_nodo (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_nodo_id UUID NOT NULL REFERENCES public.perfiles_nodo(id) ON DELETE CASCADE,
    seccion       TEXT NOT NULL CHECK (seccion IN ('interferencias','trayectoria','proximos_pasos','otros')),
    texto         TEXT NOT NULL,
    fuente_id_sesion TEXT,        -- opcional: qué sesión originó esta nota
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notas_nodo_perfil ON public.notas_nodo (perfil_nodo_id);
ALTER TABLE public.notas_nodo ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────
-- 4. RPC · upsert_perfil_nodo_y_alias_admin
--    Asigna un nombre a un speaker de una sesión. Si el nombre ya
--    existe (mismo slug), reutiliza el perfil; si no, lo crea.
--    Si se pasa "eliminar": marca el alias como eliminado.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_perfil_nodo_y_alias_admin(
    p_clerk_id  TEXT,
    p_id_sesion TEXT,
    p_speaker_id TEXT,
    p_nombre    TEXT DEFAULT NULL,
    p_eliminar  BOOLEAN DEFAULT FALSE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin   BOOLEAN;
    v_perfil_id  UUID;
    v_nombre     TEXT := NULLIF(TRIM(COALESCE(p_nombre, '')), '');
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    IF p_id_sesion IS NULL OR p_speaker_id IS NULL THEN
        RETURN json_build_object('error','missing_params');
    END IF;

    -- Caso eliminar: marcar como residual, dejar perfil_nodo_id intacto
    IF p_eliminar THEN
        INSERT INTO public.alias_nodos_sesion
            (id_sesion, speaker_id, eliminado, updated_at)
        VALUES (p_id_sesion, p_speaker_id, TRUE, NOW())
        ON CONFLICT (id_sesion, speaker_id) DO UPDATE SET
            eliminado = TRUE,
            updated_at = NOW();
        RETURN json_build_object('success', TRUE, 'eliminado', TRUE);
    END IF;

    -- Caso nombre: reactivar el alias si estaba eliminado + asociar perfil
    IF v_nombre IS NOT NULL THEN
        -- Busca o crea el perfil por slug (el slug se genera automáticamente)
        INSERT INTO public.perfiles_nodo (nombre_ancla)
        VALUES (v_nombre)
        ON CONFLICT (slug) DO UPDATE SET
            nombre_ancla = EXCLUDED.nombre_ancla,
            updated_at = NOW()
        RETURNING id INTO v_perfil_id;
    ELSE
        -- Sin nombre: desasociar perfil
        v_perfil_id := NULL;
    END IF;

    INSERT INTO public.alias_nodos_sesion
        (id_sesion, speaker_id, perfil_nodo_id, eliminado, updated_at)
    VALUES (p_id_sesion, p_speaker_id, v_perfil_id, FALSE, NOW())
    ON CONFLICT (id_sesion, speaker_id) DO UPDATE SET
        perfil_nodo_id = EXCLUDED.perfil_nodo_id,
        eliminado = FALSE,
        updated_at = NOW();

    RETURN json_build_object(
        'success', TRUE,
        'perfil_nodo_id', v_perfil_id,
        'nombre', v_nombre
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_perfil_nodo_y_alias_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 5. RPC · get_alias_nodos_sesion_admin
--    Devuelve TODOS los aliases activos + perfiles asociados. El
--    frontend hace join local con speakers_summary para resolver
--    los nombres.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_alias_nodos_sesion_admin(
    p_clerk_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN json_build_object(
        'aliases', COALESCE((
            SELECT json_agg(row_to_json(a))
            FROM (
                SELECT
                    al.id_sesion,
                    al.speaker_id,
                    al.perfil_nodo_id,
                    al.eliminado,
                    pn.nombre_ancla,
                    pn.slug,
                    pn.avatar_color
                FROM public.alias_nodos_sesion al
                LEFT JOIN public.perfiles_nodo pn ON pn.id = al.perfil_nodo_id
            ) a
        ), '[]'::json),
        'perfiles', COALESCE((
            SELECT json_agg(row_to_json(p) ORDER BY p.nombre_ancla)
            FROM (
                SELECT id, nombre_ancla, slug, notas_admin, avatar_color,
                       created_at, updated_at
                FROM public.perfiles_nodo
                ORDER BY nombre_ancla
            ) p
        ), '[]'::json)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_alias_nodos_sesion_admin(TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 6. RPC · get_expediente_nodo_admin
--    Para un perfil de nodo, devuelve todas las notas + las sesiones
--    donde apareció + sus aliases. Se consume desde el panel lateral.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_expediente_nodo_admin(
    p_clerk_id      TEXT,
    p_perfil_nodo_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN json_build_object(
        'perfil', (
            SELECT row_to_json(p)
            FROM (
                SELECT id, nombre_ancla, slug, notas_admin, avatar_color,
                       created_at, updated_at
                FROM public.perfiles_nodo
                WHERE id = p_perfil_nodo_id
            ) p
        ),
        'notas', COALESCE((
            SELECT json_agg(row_to_json(n) ORDER BY n.created_at DESC)
            FROM (
                SELECT id, seccion, texto, fuente_id_sesion, created_at
                FROM public.notas_nodo
                WHERE perfil_nodo_id = p_perfil_nodo_id
                ORDER BY created_at DESC
            ) n
        ), '[]'::json),
        'apariciones', COALESCE((
            SELECT json_agg(row_to_json(ap) ORDER BY ap.fecha DESC)
            FROM (
                SELECT
                    al.id_sesion,
                    al.speaker_id,
                    tc.fecha,
                    tc.speakers_summary -> al.speaker_id AS summary
                FROM public.alias_nodos_sesion al
                LEFT JOIN public.telemetria_camara tc ON tc.id_sesion = al.id_sesion
                WHERE al.perfil_nodo_id = p_perfil_nodo_id AND al.eliminado = FALSE
            ) ap
        ), '[]'::json)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_expediente_nodo_admin(TEXT, UUID) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 7. RPC · upsert_nota_nodo_admin  /  delete_nota_nodo_admin
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_nota_nodo_admin(
    p_clerk_id        TEXT,
    p_perfil_nodo_id  UUID,
    p_seccion         TEXT,
    p_texto           TEXT,
    p_fuente_id_sesion TEXT DEFAULT NULL,
    p_nota_id         UUID DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_nota_id  UUID;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    IF p_seccion NOT IN ('interferencias','trayectoria','proximos_pasos','otros') THEN
        RETURN json_build_object('error','invalid_seccion');
    END IF;

    IF p_nota_id IS NOT NULL THEN
        UPDATE public.notas_nodo
        SET seccion = p_seccion,
            texto = p_texto,
            fuente_id_sesion = p_fuente_id_sesion
        WHERE id = p_nota_id AND perfil_nodo_id = p_perfil_nodo_id
        RETURNING id INTO v_nota_id;
    ELSE
        INSERT INTO public.notas_nodo (perfil_nodo_id, seccion, texto, fuente_id_sesion)
        VALUES (p_perfil_nodo_id, p_seccion, p_texto, p_fuente_id_sesion)
        RETURNING id INTO v_nota_id;
    END IF;

    RETURN json_build_object('success', TRUE, 'nota_id', v_nota_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_nota_nodo_admin(TEXT, UUID, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_nota_nodo_admin(
    p_clerk_id TEXT,
    p_nota_id  UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;
    DELETE FROM public.notas_nodo WHERE id = p_nota_id;
    RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_nota_nodo_admin(TEXT, UUID) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
