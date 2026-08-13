-- 20260709e_suno_grouping.sql
-- Frecuencias Sonoras — AGRUPAR / RENOMBRAR / DESAGRUPAR álbumes desde la
-- Biblioteca. Permite tomar N piezas sueltas que ya creaste y juntarlas en un
-- álbum (comparten set_id + set_title + orden), renombrar un álbum, o sacar una
-- pieza de su álbum. Complementa el modo "expand_album" del edge (crear más
-- piezas a partir de una).
--
-- Depende de 20260709c + 20260709d. Idempotente. Pegar en Supabase Dashboard →
-- SQL Editor → New Query → Run.

-- ============================================================
-- 1. Agrupar N piezas sueltas en un álbum nuevo
-- ============================================================
CREATE OR REPLACE FUNCTION public.group_suno_creations_into_album(
    p_admin_clerk_id text,
    p_creation_ids uuid[],
    p_title text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_set uuid;
    v_total int;
    v_title text;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_total := COALESCE(array_length(p_creation_ids, 1), 0);
    IF v_total < 2 THEN
        RETURN json_build_object('error', 'need_at_least_2');
    END IF;

    v_set := gen_random_uuid();
    v_title := COALESCE(NULLIF(btrim(p_title), ''), 'Álbum');

    -- Solo piezas SUELTAS (set_id NULL) y que no estén borradas. El orden lo da
    -- la posición en el array (WITH ORDINALITY).
    UPDATE public.suno_creations c
       SET set_id       = v_set,
           set_title    = v_title,
           total_tracks = v_total,
           track_no     = o.ord,
           norte_key    = 'proj:' || lower(v_title)
      FROM unnest(p_creation_ids) WITH ORDINALITY AS o(id, ord)
     WHERE c.id = o.id
       AND c.set_id IS NULL
       AND c.status <> 'deleted';

    RETURN json_build_object('ok', true, 'set_id', v_set);
END $$;

GRANT EXECUTE ON FUNCTION public.group_suno_creations_into_album(text, uuid[], text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 2. Renombrar un álbum
-- ============================================================
CREATE OR REPLACE FUNCTION public.rename_suno_set_admin(
    p_admin_clerk_id text,
    p_set_id uuid,
    p_title text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_title text;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    v_title := COALESCE(NULLIF(btrim(p_title), ''), 'Álbum');
    UPDATE public.suno_creations
       SET set_title = v_title,
           norte_key = 'proj:' || lower(v_title)
     WHERE set_id = p_set_id;
    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.rename_suno_set_admin(text, uuid, text)
    TO anon, authenticated, service_role;

-- ============================================================
-- 3. Sacar una pieza de su álbum (vuelve a ser suelta)
-- ============================================================
CREATE OR REPLACE FUNCTION public.ungroup_suno_creation_admin(
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
    v_set uuid;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT set_id INTO v_set FROM public.suno_creations WHERE id = p_id;

    UPDATE public.suno_creations
       SET set_id = NULL, set_title = '', track_no = NULL, total_tracks = NULL
     WHERE id = p_id;

    -- Renumera + recuenta las piezas que quedan en el álbum (cosmético).
    IF v_set IS NOT NULL THEN
        WITH remaining AS (
            SELECT id, row_number() OVER (ORDER BY track_no, generated_at) AS rn,
                   count(*) OVER () AS cnt
            FROM public.suno_creations
            WHERE set_id = v_set AND status <> 'deleted'
        )
        UPDATE public.suno_creations c
           SET track_no = r.rn, total_tracks = r.cnt
          FROM remaining r
         WHERE c.id = r.id;
    END IF;

    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.ungroup_suno_creation_admin(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- FIN. Recuerda:
--   1. Sumar las 3 RPC al whitelist de admin-action (v1.33).
--   2. Redesplegar el edge generate-suno-prompt (v1.3: modo expand_album).
-- ============================================================
