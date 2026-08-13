-- Red Solar Viva · Telemetría de Navegación (capas y sub-capas visitadas)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Registra qué CAPAS (Radar · Calibración · Holoteca · Decodificador ·
-- Núcleo) y SUB-CAPAS (Códices, Meditaciones, Códigos Fuente, Fragmentos,
-- Materia, Sueños, Mis Códices, Trayectoria, Mi Firma…) abre cada
-- Tripulante, para mostrar en el Motor de Intervención → pestaña
-- "Navegación" qué se usa y qué no.
--
-- El cliente deduplica por SESIÓN (un evento por capa/sub-capa por sesión)
-- → volumen acotado; el agregado da alcance (usuarios distintos) +
-- frecuencia (eventos = sesiones que la abrieron).
--
-- Seguridad (patrón canónico del barrido 2026-06):
--   · record_nav_event  → vía gateway `user-action` (inyecta p_clerk_user_id
--     verificado del token). REVOKE anon → no hay escritura forjable.
--   · get_nav_telemetry → vía gateway `admin-action` (inyecta admin_clerk_id
--     verificado) + admin gate server-side. REVOKE anon.

-- ── Tabla de eventos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id  TEXT NOT NULL,
    layer          TEXT NOT NULL,
    sublayer       TEXT,
    platform       TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nav_events_layer
    ON nav_events (layer, sublayer);
CREATE INDEX IF NOT EXISTS idx_nav_events_user
    ON nav_events (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_nav_events_created
    ON nav_events (created_at DESC);

ALTER TABLE nav_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nav_events FROM anon, authenticated;
GRANT ALL ON nav_events TO service_role;

-- ── RPC: registrar un evento (gateway user-action inyecta el clerk id) ──
CREATE OR REPLACE FUNCTION record_nav_event(
    p_clerk_user_id TEXT,
    p_layer         TEXT,
    p_sublayer      TEXT DEFAULT NULL,
    p_platform      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR p_layer IS NULL
       OR LENGTH(TRIM(p_clerk_user_id)) = 0
       OR LENGTH(TRIM(p_layer)) = 0 THEN
        RETURN;
    END IF;
    INSERT INTO nav_events (clerk_user_id, layer, sublayer, platform)
    VALUES (
        p_clerk_user_id,
        LEFT(p_layer, 64),
        NULLIF(LEFT(COALESCE(p_sublayer, ''), 64), ''),
        NULLIF(LEFT(COALESCE(p_platform, ''), 24), '')
    );
END;
$$;

-- ── RPC admin: agregado para el panel ──────────────────────────────
CREATE OR REPLACE FUNCTION get_nav_telemetry(admin_clerk_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT json_build_object(
        'total_events', (SELECT COUNT(*) FROM nav_events),
        'total_users', (SELECT COUNT(DISTINCT clerk_user_id) FROM nav_events),
        'since', (SELECT MIN(created_at) FROM nav_events),
        'layers', COALESCE((
            SELECT json_agg(row_to_json(l) ORDER BY l.events DESC)
            FROM (
                SELECT
                    layer,
                    COUNT(*)::INT AS events,
                    COUNT(DISTINCT clerk_user_id)::INT AS users,
                    MAX(created_at) AS last_seen
                FROM nav_events
                GROUP BY layer
            ) l
        ), '[]'::json),
        'sublayers', COALESCE((
            SELECT json_agg(row_to_json(s) ORDER BY s.events DESC)
            FROM (
                SELECT
                    layer,
                    sublayer,
                    COUNT(*)::INT AS events,
                    COUNT(DISTINCT clerk_user_id)::INT AS users,
                    MAX(created_at) AS last_seen
                FROM nav_events
                WHERE sublayer IS NOT NULL
                GROUP BY layer, sublayer
            ) s
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- ── Locks: sólo service_role (vía gateways verificados) ────────────
REVOKE EXECUTE ON FUNCTION record_nav_event(TEXT, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_nav_event(TEXT, TEXT, TEXT, TEXT)
    TO service_role;
REVOKE EXECUTE ON FUNCTION get_nav_telemetry(TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nav_telemetry(TEXT)
    TO service_role;
