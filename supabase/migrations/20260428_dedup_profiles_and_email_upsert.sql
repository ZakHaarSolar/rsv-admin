-- Red Solar Viva — Limpieza de duplicados en profiles + UPSERT por email
-- ───────────────────────────────────────────────────────────────────
-- v1 (2026-04-28)
--
-- Problema: la tabla public.profiles acumuló decenas de duplicados por
-- email cuando se crearon/borraron cuentas Clerk durante pruebas (la
-- cuenta veotuluzinterna@gmail.com tenía 40+ filas, beachandsunrise
-- 3 filas, redsolarviva 2, diegosotoborja 2). El RPC ensure_profile
-- v1 sólo deduplica por clerk_user_id; cada vez que Clerk emite un
-- nuevo user_id (tras delete+create), inserta otro perfil aunque el
-- email coincida.
--
-- Solución (este script):
--  1. DEDUP: por cada email no-vacío, conserva una sola fila siguiendo
--     prioridad stripe_customer_id IS NOT NULL > is_admin = true >
--     created_at DESC. Borra el resto.
--  2. RPC v2: ensure_profile ahora intenta primero match por
--     clerk_user_id (caso normal, login subsecuente). Si no encuentra,
--     intenta match por email — si existe, REASIGNA su clerk_user_id
--     al nuevo (la cuenta Clerk vieja se reemplaza preservando el
--     mismo profile.id, así cualquier dato asociado por id sigue vivo).
--     Sólo si no hay match por ninguno, inserta una fila nueva.
--  3. UNIQUE INDEX parcial sobre lower(trim(email)) como red de
--     seguridad a nivel DB. Emails vacíos/null quedan exentos.
--
-- Aplicar desde Supabase Dashboard → SQL Editor → New Query → Run.
-- ───────────────────────────────────────────────────────────────────

BEGIN;

-- ════════════════════════════════════════════════════════════════
-- (1) DEDUP — borra duplicados por email conservando un ganador
-- ════════════════════════════════════════════════════════════════
WITH ranked AS (
    SELECT
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY lower(trim(email))
            ORDER BY
                (stripe_customer_id IS NOT NULL) DESC,
                is_admin DESC,
                created_at DESC
        ) AS rn
    FROM public.profiles
    WHERE email IS NOT NULL AND length(trim(email)) > 0
),
losers AS (
    SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM losers);

-- ════════════════════════════════════════════════════════════════
-- (2) RPC v2 — ensure_profile con upsert por email
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ensure_profile(
    p_clerk_user_id text,
    p_email text,
    p_full_name text DEFAULT '',
    p_avatar_url text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
    v_email text := lower(trim(p_email));
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RAISE EXCEPTION 'clerk_user_id requerido';
    END IF;

    -- Caso 1 — clerk_user_id ya existe: update normal
    SELECT id INTO v_id
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id;

    IF v_id IS NOT NULL THEN
        UPDATE public.profiles SET
            email      = COALESCE(NULLIF(v_email, ''), email),
            full_name  = COALESCE(NULLIF(p_full_name, ''), full_name),
            avatar_url = COALESCE(NULLIF(p_avatar_url, ''), avatar_url),
            updated_at = now()
        WHERE id = v_id;
        RETURN v_id;
    END IF;

    -- Caso 2 — el email ya existe en otra fila: reasigna su
    --          clerk_user_id al nuevo (reemplaza la cuenta Clerk
    --          vieja preservando el mismo profile.id y todo lo
    --          que dependa de él).
    IF v_email IS NOT NULL AND length(v_email) > 0 THEN
        UPDATE public.profiles SET
            clerk_user_id = p_clerk_user_id,
            full_name     = COALESCE(NULLIF(p_full_name, ''), full_name),
            avatar_url    = COALESCE(NULLIF(p_avatar_url, ''), avatar_url),
            updated_at    = now()
        WHERE lower(trim(email)) = v_email
        RETURNING id INTO v_id;

        IF v_id IS NOT NULL THEN
            RETURN v_id;
        END IF;
    END IF;

    -- Caso 3 — sin match: insert
    INSERT INTO public.profiles (
        clerk_user_id, email, full_name, avatar_url, updated_at
    ) VALUES (
        p_clerk_user_id, v_email, p_full_name, p_avatar_url, now()
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text, text) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- (3) UNIQUE INDEX parcial sobre email — red de seguridad DB
-- ════════════════════════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
    ON public.profiles (lower(trim(email)))
    WHERE email IS NOT NULL AND length(trim(email)) > 0;

COMMIT;

-- Sanity check post-aplicación: contar duplicados restantes (debe ser 0).
SELECT lower(trim(email)) AS email, COUNT(*) AS filas
FROM public.profiles
WHERE email IS NOT NULL AND length(trim(email)) > 0
GROUP BY lower(trim(email))
HAVING COUNT(*) > 1;
