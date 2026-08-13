-- 20260707_biosfera_tracks.sql
-- Capa BIÓSFERA (Holoteca) — pistas acústicas que calibran los Nodos Vegetales.
-- Tabla RLS-locked (sin policies): solo accesible por RPCs SECURITY DEFINER.
-- Lectura pública get_biosfera_tracks (anon) + CRUD admin por el gateway
-- admin-action. Seed del catálogo por defecto (audio_url NULL → Zak adjunta el
-- .mp3 de R2 desde el Motor o con un UPDATE puntual). Idempotente: el seed solo
-- corre si la tabla está vacía; los CREATE OR REPLACE reafirman los grants.
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS public.biosfera_tracks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL DEFAULT 'Pista',
    freq_label  text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    audio_url   text,                         -- URL pública de R2 (NULL = "En preparación")
    is_free     boolean NOT NULL DEFAULT true,
    sort_order  integer NOT NULL DEFAULT 0,
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.biosfera_tracks ENABLE ROW LEVEL SECURITY;  -- sin policies a propósito

-- ═══ Lectura pública (cliente Biósfera, anon) ═══
CREATE OR REPLACE FUNCTION public.get_biosfera_tracks()
RETURNS TABLE (
    id uuid, title text, freq_label text, description text,
    audio_url text, is_free boolean, sort_order integer
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT id, title, freq_label, description, audio_url, is_free, sort_order
    FROM public.biosfera_tracks
    WHERE active
    ORDER BY sort_order ASC, created_at ASC;
$$;

-- ═══ Admin: listar (incluye inactivas + sin audio) ═══
CREATE OR REPLACE FUNCTION public.admin_get_biosfera_tracks(p_admin_clerk_id text)
RETURNS SETOF public.biosfera_tracks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    RETURN QUERY SELECT * FROM public.biosfera_tracks ORDER BY sort_order ASC, created_at ASC;
END;
$$;

-- ═══ Admin: crear / actualizar ═══
CREATE OR REPLACE FUNCTION public.admin_upsert_biosfera_track(
    p_admin_clerk_id text,
    p_id uuid,
    p_title text,
    p_freq_label text,
    p_description text,
    p_audio_url text,
    p_is_free boolean,
    p_sort_order integer,
    p_active boolean
)
RETURNS public.biosfera_tracks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.biosfera_tracks;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    IF p_id IS NULL THEN
        INSERT INTO public.biosfera_tracks
            (title, freq_label, description, audio_url, is_free, sort_order, active)
        VALUES
            (COALESCE(p_title, 'Pista'), COALESCE(p_freq_label, ''), COALESCE(p_description, ''),
             p_audio_url, COALESCE(p_is_free, true), COALESCE(p_sort_order, 0), COALESCE(p_active, true))
        RETURNING * INTO r;
    ELSE
        UPDATE public.biosfera_tracks SET
            title       = COALESCE(p_title, title),
            freq_label  = COALESCE(p_freq_label, freq_label),
            description = COALESCE(p_description, description),
            audio_url   = p_audio_url,   -- NULL explícito borra el audio (vuelve a "En preparación")
            is_free     = COALESCE(p_is_free, is_free),
            sort_order  = COALESCE(p_sort_order, sort_order),
            active      = COALESCE(p_active, active)
        WHERE id = p_id
        RETURNING * INTO r;
    END IF;
    RETURN r;
END;
$$;

-- ═══ Admin: borrar ═══
CREATE OR REPLACE FUNCTION public.admin_delete_biosfera_track(p_admin_clerk_id text, p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM public.biosfera_tracks WHERE id = p_id;
END;
$$;

-- ═══ Grants ═══
REVOKE ALL ON FUNCTION public.get_biosfera_tracks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_biosfera_tracks() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_get_biosfera_tracks(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_biosfera_tracks(text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_upsert_biosfera_track(text, uuid, text, text, text, text, boolean, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_biosfera_track(text, uuid, text, text, text, text, boolean, integer, boolean) TO service_role;

REVOKE ALL ON FUNCTION public.admin_delete_biosfera_track(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_biosfera_track(text, uuid) TO service_role;

-- ═══ Seed del catálogo por defecto (solo si la tabla está vacía) ═══
INSERT INTO public.biosfera_tracks (title, freq_label, description, is_free, sort_order, active)
SELECT * FROM (VALUES
    ('Ignición de Raíz', '7.83 Hz · Resonancia Schumann',
     'El pulso base del planeta. Despierta al Nodo de su latencia y lo sincroniza con el latido de la Tierra antes de cualquier otra calibración.',
     true, 10, true),
    ('Ingesta Fotónica', '432 Hz · Fotosíntesis Cuántica',
     'Reorganiza la frecuencia de las moléculas de clorofila. El Nodo captura fotones con mayor eficiencia y convierte luz en voltaje biológico a un ritmo superior al de un entorno de estática.',
     true, 20, true),
    ('Turgencia H3O2', 'Sincronización del Estoma',
     'La vibración modula la apertura de los estomas. El agua interior se reordena en geometría hexagonal, elimina la resistencia capilar y la savia asciende sin esfuerzo. El Nodo opera en Fricción Cero.',
     true, 30, true),
    ('Malla Micelial', 'Red Neuronal Extendida',
     'Induce en el sistema radicular una respuesta que estimula la comunicación química con otros Nodos Vegetales del entorno. No es un árbol solitario: es una red neuronal geolocalizada.',
     true, 40, true),
    ('Supresión de Entropía', 'Barrera contra la estática',
     'Un Nodo alineado absorbe las emisiones electromagnéticas del Domo (Wi-Fi, radiofrecuencias de la matriz) y las transmuta en energía de crecimiento. Una casa con Nodos calibrados es un espacio donde el humano no pierde energía al dormir.',
     true, 50, true)
) AS v(title, freq_label, description, is_free, sort_order, active)
WHERE NOT EXISTS (SELECT 1 FROM public.biosfera_tracks);
