-- Red Solar Viva · Motor de Intervención v3.17 — RPCs nuevos
-- =====================================================================
-- Refactor del Motor para mostrar TODOS los nodos (no solo los que han
-- tocado el Escáner) + tracking de origen del suscriptor en la sección
-- "Lista de Correos · Nodo Central".
--
-- Dos cambios mínimos:
--
--   1. get_profiles_no_scan(p_admin_clerk_id) — devuelve los profiles
--      que NO tienen actividad en scan_vibracional. Mismo shape que
--      get_tripulantes_scan_activity pero con scan_count=0,
--      complete_cycles=0, history=[]::jsonb, in_flight_pilars=[]. El
--      cliente del Motor llama AMBOS RPCs en paralelo y junta las
--      listas — el grid pasa de "tripulantes activos" a "todos los
--      nodos". El RPC original `get_tripulantes_scan_activity` queda
--      intacto (no romper compat con otros consumidores).
--
--   2. get_email_subscription_status v2 — agrega nodo_source_from
--      (metadata->>'from' de nodo_central). SubscribeEmail.js v3
--      persiste ese valor cuando el correo de origen agrega
--      `&from=<workflow>` al subscribe link (BienvenidaNodo →
--      bienvenida_nodo, CicloSellado → ciclo_sellado). El modal
--      del Motor lo lee para mostrar "Vino de: bienvenida_nodo" en
--      la sección "Lista de Correos · Nodo Central".
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- =====================================================================

-- ============================================================
-- 1. get_profiles_no_scan (admin-only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_profiles_no_scan(
    p_admin_clerk_id TEXT
)
RETURNS TABLE (
    clerk_user_id     TEXT,
    full_name         TEXT,
    scan_count        INT,
    complete_cycles   INT,
    last_scan_ts      TIMESTAMPTZ,
    history           JSONB,
    in_flight_pilars  TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        p.clerk_user_id::TEXT,
        COALESCE(p.full_name, '')::TEXT AS full_name,
        0::INT  AS scan_count,
        0::INT  AS complete_cycles,
        NULL::TIMESTAMPTZ AS last_scan_ts,
        '[]'::JSONB AS history,
        ARRAY[]::TEXT[] AS in_flight_pilars
    FROM profiles p
    WHERE p.clerk_user_id IS NOT NULL
      AND p.clerk_user_id <> ''
      /* Excluye los que ya aparecen en get_tripulantes_scan_activity
         (cualquier scan o sonda en progreso). El cliente luego junta
         ambas listas sin duplicados. */
      AND NOT EXISTS (
          SELECT 1 FROM scan_vibracional sv
          WHERE sv.clerk_user_id = p.clerk_user_id
      )
      AND NOT EXISTS (
          SELECT 1 FROM sonda_progress sp
          WHERE sp.clerk_user_id = p.clerk_user_id
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_no_scan(TEXT)
    TO anon, authenticated;


-- ============================================================
-- 2. get_email_subscription_status v2 — suma nodo_source_from
-- ============================================================
DROP FUNCTION IF EXISTS public.get_email_subscription_status(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_email_subscription_status(
    p_target_clerk_id TEXT,
    p_admin_clerk_id  TEXT
)
RETURNS TABLE (
    email             TEXT,
    in_nodo           BOOLEAN,
    subscribed_at     TIMESTAMPTZ,
    nodo_source       TEXT,
    nodo_source_from  TEXT,
    has_opt_out       BOOLEAN,
    opted_out_at      TIMESTAMPTZ,
    opt_out_reason    TEXT,
    opt_out_category  TEXT,
    opt_out_source    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT LOWER(TRIM(p.email)) INTO v_email
    FROM profiles p
    WHERE p.clerk_user_id = p_target_clerk_id
    LIMIT 1;

    IF v_email IS NULL OR v_email = '' THEN
        RETURN QUERY SELECT
            NULL::TEXT, false, NULL::TIMESTAMPTZ, NULL::TEXT, NULL::TEXT,
            false, NULL::TIMESTAMPTZ, NULL::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        v_email AS email,

        EXISTS(SELECT 1 FROM nodo_central nc WHERE nc.email = v_email) AS in_nodo,

        (SELECT nc.subscribed_at FROM nodo_central nc
         WHERE nc.email = v_email LIMIT 1) AS subscribed_at,

        (SELECT nc.source FROM nodo_central nc
         WHERE nc.email = v_email LIMIT 1) AS nodo_source,

        /* v2 — Nuevo. Lee metadata->>'from' del row de nodo_central.
           SubscribeEmail.js v3 graba este valor cuando el subscribe link
           del correo de origen incluye &from=<workflow_id>. Permite
           rastrear desde QUÉ correo específico vino la suscripción
           (bienvenida_nodo, ciclo_sellado, etc.). Suscripciones viejas
           sin ese campo devuelven NULL. */
        (SELECT nc.metadata->>'from' FROM nodo_central nc
         WHERE nc.email = v_email LIMIT 1) AS nodo_source_from,

        EXISTS(SELECT 1 FROM email_opt_outs eo WHERE eo.email = v_email) AS has_opt_out,

        (SELECT eo.opted_out_at FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opted_out_at,

        (SELECT eo.reason FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opt_out_reason,

        (SELECT eo.category FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opt_out_category,

        (SELECT eo.source FROM email_opt_outs eo
         WHERE eo.email = v_email LIMIT 1) AS opt_out_source;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_subscription_status(TEXT, TEXT)
    TO anon, authenticated;
