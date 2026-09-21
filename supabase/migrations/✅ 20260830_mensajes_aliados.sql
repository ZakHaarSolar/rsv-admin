-- Red Solar Viva · Mensajes de marcas y aliados desde zakcero.com (Zak 2026-08-30)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- El botón "QUIERO SUMARME" de zakcero.com (sección Patrocina el Bien) abre
-- un modal con formulario; el mensaje aterriza aquí y el Motor de
-- Intervención lo lee en su sección "Aliados". Tres piezas:
--   1. Tabla mensajes_aliados (RLS activo sin policies: solo DEFINER entra).
--   2. RPC pública enviar_mensaje_aliado (anon, valida y solo INSERTA).
--   3. RPCs admin (leer + marcar leído) con el doble blindaje de la casa:
--      gateway admin-action + revalidación is_admin dentro de la RPC.

CREATE TABLE IF NOT EXISTS mensajes_aliados (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     TEXT NOT NULL,
    marca      TEXT,
    correo     TEXT NOT NULL,
    mensaje    TEXT NOT NULL,
    origen     TEXT NOT NULL DEFAULT 'zakcero.com',
    leido      BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mensajes_aliados ENABLE ROW LEVEL SECURITY;

-- ── 2. La puerta pública: solo mete, jamás lee ──

CREATE OR REPLACE FUNCTION enviar_mensaje_aliado(
    p_nombre  TEXT,
    p_marca   TEXT,
    p_correo  TEXT,
    p_mensaje TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_nombre IS NULL OR btrim(p_nombre) = ''
       OR p_correo IS NULL OR position('@' IN p_correo) = 0
       OR p_mensaje IS NULL OR btrim(p_mensaje) = '' THEN
        RAISE EXCEPTION 'datos_invalidos';
    END IF;

    INSERT INTO mensajes_aliados (nombre, marca, correo, mensaje)
    VALUES (
        left(btrim(p_nombre), 120),
        NULLIF(left(btrim(COALESCE(p_marca, '')), 160), ''),
        left(btrim(p_correo), 200),
        left(btrim(p_mensaje), 2000)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION enviar_mensaje_aliado(TEXT, TEXT, TEXT, TEXT)
    TO anon, authenticated, service_role;

-- ── 3a. El Motor lee la mesa ──

CREATE OR REPLACE FUNCTION admin_get_mensajes_aliados(
    p_admin_clerk_id TEXT
)
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
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT COALESCE(json_agg(t ORDER BY t.created_at DESC), '[]'::json)
    INTO result
    FROM (
        SELECT id, nombre, marca, correo, mensaje, origen, leido, created_at
        FROM mensajes_aliados
        ORDER BY created_at DESC
        LIMIT 300
    ) t;

    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_get_mensajes_aliados(TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_mensajes_aliados(TEXT)
    TO service_role;

-- ── 3b. Marcar leído / no leído ──

CREATE OR REPLACE FUNCTION admin_set_mensaje_aliado_leido(
    p_id             UUID,
    p_leido          BOOLEAN,
    p_admin_clerk_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE mensajes_aliados
    SET leido = COALESCE(p_leido, true)
    WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_mensaje_aliado_leido(UUID, BOOLEAN, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_set_mensaje_aliado_leido(UUID, BOOLEAN, TEXT)
    TO service_role;
