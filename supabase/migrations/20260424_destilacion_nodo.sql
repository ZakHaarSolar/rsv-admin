-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Destilación Profunda por Nodo
--
-- Guarda el último análisis IA de cada nodo (cruza sus últimas 4
-- sesiones y destila 3 pilares: interferencias, intenciones, logros).
-- Cada vez que se solicita un nuevo análisis, reemplaza al anterior
-- (ON CONFLICT DO UPDATE via UNIQUE(perfil_nodo_id)).
--
-- Aplicar desde Supabase Dashboard → SQL Editor → New Query → Run.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS destilacion_nodo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_nodo_id UUID NOT NULL REFERENCES perfiles_nodo(id) ON DELETE CASCADE,
    solicitado_por TEXT NOT NULL,
    solicitado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    n_sesiones INT NOT NULL,
    fechas TEXT[] NOT NULL DEFAULT '{}',
    modelo TEXT NOT NULL,
    interferencias JSONB NOT NULL DEFAULT '[]',
    intenciones JSONB NOT NULL DEFAULT '[]',
    logros JSONB NOT NULL DEFAULT '[]',
    sintesis TEXT,
    usage JSONB,
    UNIQUE(perfil_nodo_id)
);

ALTER TABLE destilacion_nodo ENABLE ROW LEVEL SECURITY;

-- No policies: todo acceso pasa por RPCs SECURITY DEFINER que validan is_admin.

-- ─────────────────────────────────────────────────────────────────────
-- RPC: lee la destilación actual del nodo (o null si aún no hay).
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_destilacion_nodo_admin(TEXT, UUID) CASCADE;
CREATE OR REPLACE FUNCTION get_destilacion_nodo_admin(
    p_clerk_id TEXT,
    p_perfil_nodo_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_row destilacion_nodo%ROWTYPE;
BEGIN
    IF p_clerk_id IS NULL OR p_perfil_nodo_id IS NULL THEN
        RETURN jsonb_build_object('error', 'missing_params');
    END IF;

    SELECT is_admin INTO v_is_admin
    FROM profiles
    WHERE clerk_user_id = p_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN jsonb_build_object('error', 'not_admin');
    END IF;

    SELECT * INTO v_row
    FROM destilacion_nodo
    WHERE perfil_nodo_id = p_perfil_nodo_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'destilacion', NULL);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'destilacion', jsonb_build_object(
            'id', v_row.id,
            'perfil_nodo_id', v_row.perfil_nodo_id,
            'solicitado_en', v_row.solicitado_en,
            'n_sesiones', v_row.n_sesiones,
            'fechas', v_row.fechas,
            'modelo', v_row.modelo,
            'interferencias', v_row.interferencias,
            'intenciones', v_row.intenciones,
            'logros', v_row.logros,
            'sintesis', v_row.sintesis
        )
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- RPC: upsert de la destilación — solo lo invoca la edge function
-- con service role. Por defensa también valida perfil exista.
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS save_destilacion_nodo(UUID, TEXT, INT, TEXT[], TEXT, JSONB, JSONB, JSONB, TEXT, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION save_destilacion_nodo(
    p_perfil_nodo_id UUID,
    p_solicitado_por TEXT,
    p_n_sesiones INT,
    p_fechas TEXT[],
    p_modelo TEXT,
    p_interferencias JSONB,
    p_intenciones JSONB,
    p_logros JSONB,
    p_sintesis TEXT,
    p_usage JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO destilacion_nodo(
        perfil_nodo_id, solicitado_por, n_sesiones, fechas, modelo,
        interferencias, intenciones, logros, sintesis, usage, solicitado_en
    )
    VALUES (
        p_perfil_nodo_id, p_solicitado_por, p_n_sesiones, p_fechas, p_modelo,
        COALESCE(p_interferencias, '[]'::jsonb),
        COALESCE(p_intenciones, '[]'::jsonb),
        COALESCE(p_logros, '[]'::jsonb),
        p_sintesis, p_usage, NOW()
    )
    ON CONFLICT (perfil_nodo_id) DO UPDATE SET
        solicitado_por = EXCLUDED.solicitado_por,
        solicitado_en = NOW(),
        n_sesiones = EXCLUDED.n_sesiones,
        fechas = EXCLUDED.fechas,
        modelo = EXCLUDED.modelo,
        interferencias = EXCLUDED.interferencias,
        intenciones = EXCLUDED.intenciones,
        logros = EXCLUDED.logros,
        sintesis = EXCLUDED.sintesis,
        usage = EXCLUDED.usage
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_destilacion_nodo_admin(TEXT, UUID) TO anon, authenticated;
-- save_destilacion_nodo no se expone — se llama solo desde edge function.

NOTIFY pgrst, 'reload schema';
