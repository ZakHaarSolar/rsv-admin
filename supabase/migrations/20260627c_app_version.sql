-- Red Solar Viva · app_version (telemetría de versión por nodo) + get_tripulante_extras v9
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Qué hace:
--   (1) Agrega a `profiles` las columnas `app_version` + `app_version_updated_at`.
--   (2) RPC `set_app_version(p_clerk_user_id, p_app_version)` — la app la llama
--       por el gateway `user-action` (que inyecta el clerk_user_id verificado)
--       en cada arranque con sesión. Escribe SOLO la fila del propio Tripulante.
--   (3) `get_tripulante_extras` v9 — suma `app_version` + `app_version_updated_at`
--       al resultado (misma firma TEXT,TEXT → el gateway admin-action ya la
--       enruta; NO requiere redeploy de esa edge). El Motor → Nodos Activos
--       muestra qué versión corre cada nodo.
--
-- 🜂 La versión es un número INTERNO (el usuario no la ve). La app la sube en
--    cada build (lib/appVersion.ts → APP_VERSION). Build actual = "1.0.5".

-- ── (1) Columnas ──────────────────────────────────────────────────────
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS app_version            text,
    ADD COLUMN IF NOT EXISTS app_version_updated_at  timestamptz;

-- ── (2) RPC de escritura (gateway user-action) ────────────────────────
CREATE OR REPLACE FUNCTION public.set_app_version(
    p_clerk_user_id text,
    p_app_version   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN;
    END IF;
    UPDATE profiles
       SET app_version            = NULLIF(LEFT(COALESCE(p_app_version, ''), 32), ''),
           app_version_updated_at = now()
     WHERE clerk_user_id = p_clerk_user_id;
END;
$$;

-- Lock: solo service_role (la edge user-action) la ejecuta. anon directo → 401.
REVOKE EXECUTE ON FUNCTION public.set_app_version(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_app_version(text, text) TO service_role;

-- ── (3) get_tripulante_extras v9 ──────────────────────────────────────
-- Supersede a v8 (20260617). Misma firma + 2 columnas nuevas al final.
DROP FUNCTION IF EXISTS get_tripulante_extras(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_tripulante_extras(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    is_subscriber                       BOOLEAN,
    tier                                TEXT,
    decoder_scans_used                  INT,
    dream_scans_used                    INT,
    last_complete_cycle_ts              TIMESTAMPTZ,
    email                               TEXT,
    purchases                           JSONB,
    subscription_started_at             TIMESTAMPTZ,
    subscription_current_period_end     TIMESTAMPTZ,
    subscription_cancel_at_period_end   BOOLEAN,
    subscription_is_gift                BOOLEAN,
    app_version                         TEXT,
    app_version_updated_at              TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_email TEXT;
BEGIN
    /* Admin gate. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.email INTO target_email
    FROM profiles p
    WHERE p.clerk_user_id = target_clerk_id
    LIMIT 1;

    RETURN QUERY
    WITH active_sub AS (
        SELECT
            s.group_name,
            s.current_period_start,
            s.current_period_end,
            s.cancel_at_period_end,
            s.stripe_subscription_id
        FROM subscriptions s
        WHERE s.email = target_email
          AND s.status = 'active'
          AND (
              s.current_period_end IS NULL
              OR s.current_period_end > NOW()
          )
        ORDER BY
            CASE s.group_name
                WHEN 'inmersion' THEN 1
                WHEN 'pulsar'    THEN 2
                WHEN 'cuasar'    THEN 2
                WHEN 'sintonia'  THEN 3
                WHEN 'dream'     THEN 4
                WHEN 'decoder'   THEN 5
                ELSE 9
            END
        LIMIT 1
    )
    SELECT
        EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.email = target_email
              AND s.status = 'active'
              AND (
                  s.current_period_end IS NULL
                  OR s.current_period_end > NOW()
              )
        ) AS is_subscriber,

        (SELECT group_name FROM active_sub) AS tier,

        (
            SELECT COUNT(*)::INT
            FROM decoder_scans ds
            WHERE ds.clerk_user_id = target_clerk_id
        ) AS decoder_scans_used,

        (
            SELECT COUNT(*)::INT
            FROM dream_scans dsk
            WHERE dsk.clerk_user_id = target_clerk_id
        ) AS dream_scans_used,

        (
            SELECT sv.created_at
            FROM scan_vibracional sv
            WHERE sv.clerk_user_id = target_clerk_id
              AND sv.cycle_scanned_json IS NOT NULL
              AND sv.cycle_scanned_json::TEXT <> ''
              AND (
                  LENGTH(sv.cycle_scanned_json::TEXT)
                  - LENGTH(REPLACE(sv.cycle_scanned_json::TEXT, ',', ''))
              ) = 5
            ORDER BY sv.created_at DESC
            LIMIT 1
        ) AS last_complete_cycle_ts,

        target_email AS email,

        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'book_id', p.book_id,
                        'title', COALESCE(b.title, 'Códice'),
                        'device', p.acquired_device,
                        'formats', p.formats_purchased,
                        'purchased_at', p.purchased_at,
                        'amount_cents', p.amount_cents
                    )
                    ORDER BY p.purchased_at DESC
                )
                FROM purchases p
                LEFT JOIN books b ON b.id = p.book_id
                WHERE (
                    target_email IS NOT NULL
                    AND LOWER(TRIM(p.email)) = LOWER(TRIM(target_email))
                )
                AND COALESCE(p.acquired_via, 'pago') = 'pago'
            ),
            '[]'::jsonb
        ) AS purchases,

        (SELECT current_period_start FROM active_sub)
            AS subscription_started_at,
        (SELECT current_period_end FROM active_sub)
            AS subscription_current_period_end,
        COALESCE(
            (SELECT cancel_at_period_end FROM active_sub),
            false
        ) AS subscription_cancel_at_period_end,
        COALESCE(
            (
                SELECT stripe_subscription_id LIKE 'gift_%'
                FROM active_sub
            ),
            false
        ) AS subscription_is_gift,

        /* v9 — versión de la app que corre el nodo (telemetría interna). */
        (
            SELECT p.app_version FROM profiles p
            WHERE p.clerk_user_id = target_clerk_id LIMIT 1
        ) AS app_version,
        (
            SELECT p.app_version_updated_at FROM profiles p
            WHERE p.clerk_user_id = target_clerk_id LIMIT 1
        ) AS app_version_updated_at;
END;
$$;

-- Re-aplicar el lock de 20260612d (el DROP/CREATE reabrió EXECUTE a PUBLIC).
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure::text AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'get_tripulante_extras'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', r.sig);
    END LOOP;
END $$;
