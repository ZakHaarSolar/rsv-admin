-- Red Solar Viva · get_tripulante_extras v7 (conteo de Sueños decodificados)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- v7 (2026-06-16): añade la columna `dream_scans_used` al bundle de
-- datos por-Tripulante del Motor de Intervención. Es el conteo de por
-- vida de Sueños decodificados por el Tripulante:
--
--     SELECT COUNT(*) FROM dream_records WHERE clerk_user_id = target.
--
-- `dream_records` (Bóveda de Estasis) registra CADA sueño decodificado
-- de TODOS los Tripulantes (≠ `dream_scans`, que es el contador
-- freemium de no-miembros). Por eso el conteo correcto de "cuántos
-- sueños ha solicitado un usuario" sale de `dream_records`.
--
-- Se mantiene el mismo nombre y firma de la función (TEXT, TEXT) →
-- el gateway `admin-action` ya la enruta (whitelist con admin_clerk_id),
-- así que NO requiere redeploy de la edge. El admin gate
-- (profiles.is_admin del admin_clerk_id) sigue igual.
--
-- Patrón de seguridad: SECURITY DEFINER + admin gate al inicio. La
-- RPC quedó REVOKE'd de anon/authenticated en la auditoría 2026-06-12d
-- (sólo service_role la ejecuta, vía el gateway verificado). Como este
-- archivo hace DROP + CREATE, Postgres reabriría el EXECUTE a PUBLIC por
-- defecto → el bloque DO del final RE-APLICA el lock (REVOKE PUBLIC/anon/
-- authenticated + GRANT service_role). NO re-otorgar a anon: reabriría la
-- escalada anon→admin que 20260612d cerró.

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
    subscription_is_gift                BOOLEAN
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
          /* v6 — Guarda de expiración. NULL = subscripción sin
             ciclo aún (pre-billing); > NOW() = ciclo todavía
             vigente. Cualquier otra cosa = expirada. */
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

        /* v7 — Sueños decodificados de por vida (Bóveda de Estasis). */
        (
            SELECT COUNT(*)::INT
            FROM dream_records dr
            WHERE dr.clerk_user_id = target_clerk_id
        ) AS dream_scans_used,

        /* Último ciclo COMPLETO — comas en TEXT. 6 pilares = 5 comas. */
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

        /* Códices comprados (igual que v6). */
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

        /* v5 — Fechas y flags del ciclo de la membresía vigente. */
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
        ) AS subscription_is_gift;
END;
$$;

-- Re-aplicar el lock de 20260612d (el DROP/CREATE de arriba reabrió el
-- EXECUTE a PUBLIC). Sólo service_role la ejecuta → el panel admin sigue
-- funcionando por el gateway verificado `admin-action`; anon directo da
-- 401 permission denied.
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
        EXECUTE format('GRANT  EXECUTE ON FUNCTION %s TO service_role;', r.sig);
        RAISE NOTICE 'Locked %', r.sig;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
