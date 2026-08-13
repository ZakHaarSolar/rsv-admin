-- 20260602d_vtli_atelier_voices.sql
-- Estudio Manual — VOCES MANUALES EN LA NUBE. Las voces que Zak agrega con
-- "Voz por ID" (cualquier Voice ID de ElevenLabs: Myrddin, etc.) ahora viven
-- en la DB en vez del navegador, así aparecen iguales desde cualquier compu
-- al iniciar sesión. (Las narraciones/tomas ya viven en la DB desde 20260602c.)
-- Tabla compartida entre admins (Zak es el único). Aplicar pegando este
-- archivo COMPLETO en Supabase Dashboard → SQL Editor → New Query → Run.

-- ============================================================
-- 1. TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vtli_atelier_voices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_id text NOT NULL UNIQUE,           -- Voice ID de ElevenLabs
    name text NOT NULL,                      -- etiqueta para el selector
    settings jsonb NOT NULL DEFAULT '{}'::jsonb, -- ajustes ElevenLabs por voz
    rhythm text,                             -- 'meditativo' | 'natural' | 'agil' (referencia UI)
    sort_order int NOT NULL DEFAULT 0,
    created_by_clerk_id text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.vtli_atelier_voices IS
    'Voces manuales del Estudio Manual (pegadas con "Voz por ID"). Compartidas entre admins → sincronizan cross-device. Lockdown via RLS sin policies; acceso por RPCs SECURITY DEFINER.';

ALTER TABLE public.vtli_atelier_voices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RPC: get_vtli_atelier_voices — lista (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vtli_atelier_voices(
    p_admin_clerk_id text
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
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(sub) ORDER BY sub.sort_order, sub.created_at)
    INTO v_result
    FROM (
        SELECT id, voice_id, name, settings, rhythm, sort_order, created_at
        FROM public.vtli_atelier_voices
        ORDER BY sort_order, created_at
    ) sub;

    RETURN json_build_object('voices', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_vtli_atelier_voices(text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 3. RPC: upsert_vtli_atelier_voice — agregar/actualizar (admin-only)
-- Upsert por voice_id (si ya existe, actualiza nombre/ajustes/ritmo).
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_vtli_atelier_voice(
    p_admin_clerk_id text,
    p_voice_id text,
    p_name text,
    p_settings jsonb DEFAULT '{}'::jsonb,
    p_rhythm text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_id uuid;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    IF p_voice_id IS NULL OR length(trim(p_voice_id)) = 0 THEN
        RETURN json_build_object('error', 'missing_voice_id');
    END IF;

    INSERT INTO public.vtli_atelier_voices
        (voice_id, name, settings, rhythm, created_by_clerk_id)
    VALUES (
        trim(p_voice_id),
        COALESCE(NULLIF(trim(p_name), ''), trim(p_voice_id)),
        COALESCE(p_settings, '{}'::jsonb),
        p_rhythm,
        p_admin_clerk_id
    )
    ON CONFLICT (voice_id) DO UPDATE
        SET name = EXCLUDED.name,
            settings = EXCLUDED.settings,
            rhythm = EXCLUDED.rhythm,
            updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN json_build_object('success', true, 'id', v_id, 'voice_id', trim(p_voice_id));
END $$;

GRANT EXECUTE ON FUNCTION public.upsert_vtli_atelier_voice(text, text, text, jsonb, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 4. RPC: delete_vtli_atelier_voice — quitar (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_vtli_atelier_voice(
    p_admin_clerk_id text,
    p_voice_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_deleted int;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    DELETE FROM public.vtli_atelier_voices
    WHERE voice_id = trim(p_voice_id);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN json_build_object('success', true, 'deleted', v_deleted);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_vtli_atelier_voice(text, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- Fin de migración 20260602d_vtli_atelier_voices.sql
--
-- Validar tras aplicar:
--   SELECT get_vtli_atelier_voices('TU_CLERK_ID');
-- ============================================================
