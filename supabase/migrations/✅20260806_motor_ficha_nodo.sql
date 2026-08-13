-- Red Solar Viva · LA FICHA DEL NODO DICE MÁS (2026-08-06)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente / re-ejecutable.
--
-- Tres cosas que el Motor → Nodos Activos no podía mostrar:
--
--   (1) REFLEJOS DEL ESPEJO: cuántos lleva enviados y cuántos le quedan de
--       los 3 de cortesía. Mismo origen que usa el propio Espejo
--       (oraculo_usage.sent_count, con respaldo a contar sus mensajes).
--
--   (2) EL ONBOARDING SE ENLAZA A LA CUENTA. El embudo se registra ANTES
--       de que exista sesión, con un id anónimo del aparato. Al crear
--       cuenta, ese registro y la persona quedaban sin relación: se veían
--       "Usuario 1, 2…" sueltos y la ficha del nodo no podía decir por
--       dónde llegó. Ahora la app sella el vínculo la primera vez que hay
--       sesión con un id anónimo a mano.
--       🜂 El embudo SIGUE siendo anónimo para el panel del embudo (esa
--       pantalla nunca lee esta columna); el enlace solo permite responder
--       "¿qué contestó ESTE nodo?" dentro de su propia ficha.
--
--   (3) Y de paso, get_tripulante_platforms entiende las etiquetas nuevas
--       de aparato (web-movil / web-escritorio), para distinguir quién
--       entra desde el navegador del teléfono y quién desde la computadora.

-- ── (1) Columna de enlace + índice ───────────────────────────────────
ALTER TABLE public.onb_funnel
    ADD COLUMN IF NOT EXISTS clerk_user_id text;

CREATE INDEX IF NOT EXISTS idx_onb_funnel_clerk
    ON public.onb_funnel (clerk_user_id)
    WHERE clerk_user_id IS NOT NULL;

-- ── (2) Sellado del vínculo (lo llama la app por el gateway user-action,
--        que inyecta el clerk id VERIFICADO del token) ─────────────────
CREATE OR REPLACE FUNCTION public.link_onb_to_user(
    p_clerk_user_id text,
    p_anon          uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' OR p_anon IS NULL THEN
        RETURN;
    END IF;
    /* Solo sella si está libre: si dos cuentas comparten un aparato, el
       recorrido pertenece a la primera que lo reclamó y la segunda no lo
       pisa. */
    UPDATE public.onb_funnel
       SET clerk_user_id = p_clerk_user_id
     WHERE anon_id = p_anon
       AND clerk_user_id IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_onb_to_user(text, uuid)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.link_onb_to_user(text, uuid)
    TO service_role;

-- ── (3) Ficha ampliada del nodo: reflejos + onboarding ───────────────
CREATE OR REPLACE FUNCTION public.get_tripulante_espejo_onb(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    reflejos_enviados   INT,
    reflejos_restantes  INT,
    reflejos_limite     INT,
    onb_max_step        INT,
    onb_completed       BOOLEAN,
    onb_answers         JSONB,
    onb_platform        TEXT,
    onb_started_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lim      INT := 3;   -- FREE_ORACULO_LIMIT del edge oraculo-chat
    v_enviados INT := 0;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    /* Contador oficial; si no existe fila, se cuentan sus mensajes. */
    SELECT COALESCE(u.sent_count, 0) INTO v_enviados
    FROM oraculo_usage u
    WHERE u.clerk_user_id = target_clerk_id
    LIMIT 1;

    IF v_enviados IS NULL OR v_enviados = 0 THEN
        SELECT COUNT(*)::INT INTO v_enviados
        FROM oraculo_messages m
        WHERE m.clerk_user_id = target_clerk_id
          AND m.role = 'user';
    END IF;
    v_enviados := COALESCE(v_enviados, 0);

    RETURN QUERY
    SELECT
        v_enviados,
        GREATEST(0, v_lim - v_enviados),
        v_lim,
        o.max_step,
        o.completed,
        o.answers,
        o.platform,
        o.started_at
    FROM (SELECT 1) AS _
    LEFT JOIN LATERAL (
        SELECT f.max_step, f.completed, f.answers, f.platform, f.started_at
        FROM onb_funnel f
        WHERE f.clerk_user_id = target_clerk_id
        ORDER BY f.updated_at DESC
        LIMIT 1
    ) o ON TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tripulante_espejo_onb(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_tripulante_espejo_onb(TEXT, TEXT)
    TO service_role;

-- ── (4) get_tripulante_platforms entiende navegador móvil vs escritorio ─
CREATE OR REPLACE FUNCTION public.get_tripulante_platforms(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (platforms TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    WITH vistos AS (
        SELECT LOWER(TRIM(pt.platform)) AS p
        FROM push_tokens pt
        WHERE pt.clerk_user_id = target_clerk_id
          AND COALESCE(TRIM(pt.platform), '') <> ''
        UNION
        SELECT LOWER(TRIM(ne.platform)) AS p
        FROM nav_events ne
        WHERE ne.clerk_user_id = target_clerk_id
          AND COALESCE(TRIM(ne.platform), '') <> ''
    ),
    norm AS (
        SELECT DISTINCT
            CASE
                WHEN v.p IN ('ios', 'iphone', 'ipad')     THEN 'ios'
                WHEN v.p IN ('android')                   THEN 'android'
                WHEN v.p IN ('web-movil', 'web_movil')    THEN 'web-movil'
                WHEN v.p IN ('web-escritorio', 'web_escritorio', 'desktop')
                                                          THEN 'web-escritorio'
                /* Las filas ANTERIORES a esta afinación solo decían "web":
                   se conservan como tales, sin inventarles un aparato. */
                WHEN v.p IN ('web', 'browser')            THEN 'web'
                ELSE v.p
            END AS p
        FROM vistos v
    )
    SELECT COALESCE(
        (SELECT string_agg(n.p, ',' ORDER BY
            CASE n.p
                WHEN 'ios'            THEN 1
                WHEN 'android'        THEN 2
                WHEN 'web-escritorio' THEN 3
                WHEN 'web-movil'      THEN 4
                WHEN 'web'            THEN 5
                ELSE 6
            END)
         FROM norm n),
        ''
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tripulante_platforms(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_tripulante_platforms(TEXT, TEXT)
    TO service_role;
