-- Red Solar Viva · Device tracking de compras de Códices
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Suma columna `acquired_device` a `purchases` para registrar desde
-- qué pantalla el tripulante hizo la compra del Códice. Valores:
--   · 'mobile'  — Lente (iPhone/Android)
--   · 'desktop' — Centro de Mando (computadora/laptop)
--   · NULL      — origen desconocido (compras viejas pre-tracking, o
--                 webhooks de productos no-Códices como Sintonía Solar
--                 que NO llevan sufijo __m/__d en client_reference_id)
--
-- El insert lo hace el edge function `stripe-webhook` (Supabase) al
-- procesar `checkout.session.completed`: parsea el sufijo del
-- `client_reference_id` (ej. "user_2x...__m" → device='mobile') y
-- pasa el flag al upsert de purchases.
--
-- También actualizamos el RPC `get_tripulante_extras` a v4: ahora
-- devuelve también `purchases` (JSON array de Códices comprados con
-- título + device + fecha) para que el modal del Motor de Intervención
-- pueda renderizar el desglose en la columna derecha del panel.
--
-- Compatibilidad: las funciones existentes que filtran por
-- `acquired_via = 'pago'` siguen funcionando — la nueva columna es
-- aditiva y no rompe ninguna query previa. `admin_reset_my_codices`
-- ya borra TODA la fila de purchases del admin → la nueva columna
-- también se borra en cascada sin tocar nada.

-- 1. Columna acquired_device
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS acquired_device TEXT;

COMMENT ON COLUMN purchases.acquired_device IS
'Origen device de la compra: mobile (Lente) | desktop (Centro de Mando) | NULL';

CREATE INDEX IF NOT EXISTS idx_purchases_acquired_device
    ON purchases (acquired_device)
    WHERE acquired_device IS NOT NULL;

-- 2. RPC get_tripulante_extras v4 (suma `purchases` al return)
DROP FUNCTION IF EXISTS get_tripulante_extras(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_tripulante_extras(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (
    is_subscriber          BOOLEAN,
    tier                   TEXT,
    decoder_scans_used     INT,
    last_complete_cycle_ts TIMESTAMPTZ,
    email                  TEXT,
    purchases              JSONB
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
    SELECT
        EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.email = target_email
              AND s.status = 'active'
        ) AS is_subscriber,

        (
            SELECT s.group_name
            FROM subscriptions s
            WHERE s.email = target_email
              AND s.status = 'active'
            ORDER BY
                CASE s.group_name
                    WHEN 'inmersion' THEN 1
                    WHEN 'pulsar'    THEN 2
                    WHEN 'cuasar'    THEN 2
                    WHEN 'sintonia'  THEN 3
                    ELSE 9
                END
            LIMIT 1
        ) AS tier,

        (
            SELECT COUNT(*)::INT
            FROM decoder_scans ds
            WHERE ds.clerk_user_id = target_clerk_id
        ) AS decoder_scans_used,

        /* Último ciclo COMPLETO — contamos comas en el TEXT. 6 pilares
           = 5 comas. Sin cast, sin riesgo de runtime ERROR 42883. */
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

        /* v4 — Lista de Códices comprados con device + fecha + formato.
           Match por email (lowercased trim) o user_id. Sólo compras de
           pago (excluye canjes con Cristal). Ordenado más reciente
           primero. Si no hay compras devuelve [] (no NULL). */
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
        ) AS purchases;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tripulante_extras(TEXT, TEXT)
    TO anon, authenticated;
