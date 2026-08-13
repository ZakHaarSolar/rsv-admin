-- Red Solar Viva · Reseteador de medallas (QA) — Motor → Medallas
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Borra los desbloqueos (medal_unlocks) de un Tripulante para una constelación
-- (o todas). Las medallas son PERMANENTES por diseño; esto sirve para REINICIAR
-- en pruebas. Tras el borrado, la próxima llamada a get_my_medals re-evalúa contra
-- las métricas ACTUALES del Tripulante (si ya bajaste sus Fotones / etapa de avatar
-- a 0, no se vuelve a desbloquear; si la métrica sigue alta, se re-desbloquea — el
-- medallón refleja la métrica real).
--
-- p_constelacion_key: la clave de la constelación (ej. 'fotones' = Lluvia de
--   Fotones, 'ascension' = Ascensión). Vacío / '*' / 'all' → borra TODAS.

CREATE OR REPLACE FUNCTION public.admin_reset_user_medals(
    p_admin_clerk_id   text,
    p_target_email     text,
    p_constelacion_key text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    em  text := lower(trim(coalesce(p_target_email, '')));
    ck  text := lower(trim(coalesce(p_constelacion_key, '')));
    uid text;
    n_deleted int := 0;
BEGIN
    -- Gate admin.
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;

    IF length(em) = 0 THEN
        RETURN json_build_object('error', 'no_email');
    END IF;

    -- Resolver el correo → clerk_user_id (prioriza la fila admin si hay duplicados).
    SELECT clerk_user_id INTO uid FROM profiles
    WHERE lower(email) = em
    ORDER BY (is_admin IS TRUE) DESC
    LIMIT 1;
    IF uid IS NULL THEN
        RETURN json_build_object('error', 'user_not_found', 'email', em);
    END IF;

    IF ck IN ('', '*', 'all', 'todas') THEN
        -- Reset TOTAL: borra todos los desbloqueos del Tripulante.
        DELETE FROM medal_unlocks WHERE clerk_user_id = uid;
    ELSE
        -- Validar que la constelación exista.
        IF NOT EXISTS (
            SELECT 1 FROM medal_constelaciones WHERE constelacion_key = ck
        ) THEN
            RETURN json_build_object('error', 'no_constelacion_key', 'key', ck);
        END IF;
        DELETE FROM medal_unlocks
        WHERE clerk_user_id = uid AND constelacion_key = ck;
    END IF;
    GET DIAGNOSTICS n_deleted = ROW_COUNT;

    RETURN json_build_object(
        'ok', true,
        'email', em,
        'clerk_user_id', uid,
        'constelacion_key', CASE WHEN ck IN ('', '*', 'all', 'todas') THEN 'todas' ELSE ck END,
        'deleted_count', n_deleted
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_reset_user_medals(text, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_medals(text, text, text)
    TO service_role;
