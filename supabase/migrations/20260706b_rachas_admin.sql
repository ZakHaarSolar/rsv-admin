-- Red Solar Viva · CONTADOR DE RACHAS — telemetría admin para el Motor
-- =====================================================================
-- 20260706b_rachas_admin.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: admin-action v1.29 (suma las 2 acciones) + MI_Detail v1.14 (card
-- "Rachas" en el detalle del nodo) + MotorDeIntervencion v3.63 (pestaña
-- anónima "Rachas"). Requiere 20260706_rachas.sql aplicada.
--
-- ÉTICA (decisión 2026-07-06): los TÍTULOS de las rachas son texto libre del
-- Tripulante (hábitos íntimos) → mismo tratamiento que los sueños/Espejo:
--   · Por NODO (Padrón → detalle): SOLO números — cuántas rachas activas,
--     días de cada una y si es miembro. SIN títulos.
--   · Pestaña "Rachas" del Motor: títulos VISIBLES pero ANONIMIZADOS
--     (sin id, sin correo, sin alias) — para entender PARA QUÉ usan la capa,
--     sin saber QUIÉN. Espejo de admin_get_oraculo_conversations.
--
-- Seguridad: SECURITY DEFINER + doble blindaje (valida is_admin con el id
-- admin verificado que inyecta el gateway admin-action). REVOKE anon.

-- ── Por nodo: números sin títulos ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_user_rachas(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN json_build_object(
        'count', COALESCE((
            SELECT COUNT(*)::int FROM rachas
            WHERE clerk_user_id = p_target_clerk_id
        ), 0),
        'is_member', public._is_active_member(p_target_clerk_id),
        -- Solo métricas por racha (SIN título): días vivos, inicio y récord.
        'rachas', COALESCE((
            SELECT json_agg(json_build_object(
                'days', FLOOR(GREATEST(0, EXTRACT(EPOCH FROM (now() - r.started_at))) / 86400)::int,
                'started_at', r.started_at,
                'best_days', FLOOR(r.best_seconds / 86400)::int
            ) ORDER BY r.started_at)
            FROM rachas r
            WHERE r.clerk_user_id = p_target_clerk_id
        ), '[]'::json)
    );
END $$;

-- ── Pestaña anónima: títulos + días, SIN identidad ───────────────────
CREATE OR REPLACE FUNCTION public.admin_get_rachas_anon(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    RETURN json_build_object(
        'total', COALESCE((SELECT COUNT(*)::int FROM rachas), 0),
        'nodos', COALESCE((
            SELECT COUNT(DISTINCT clerk_user_id)::int FROM rachas
        ), 0),
        'members', COALESCE((
            SELECT COUNT(*)::int FROM rachas r
            WHERE public._is_active_member(r.clerk_user_id)
        ), 0),
        -- Lista anónima: título + días + miembro. SIN clerk_user_id, SIN
        -- correo, SIN alias. Orden: las rachas más largas primero.
        'rachas', COALESCE((
            SELECT json_agg(row_json ORDER BY days DESC)
            FROM (
                SELECT
                    json_build_object(
                        'title', r.title,
                        'days', FLOOR(GREATEST(0, EXTRACT(EPOCH FROM (now() - r.started_at))) / 86400)::int,
                        'is_member', public._is_active_member(r.clerk_user_id)
                    ) AS row_json,
                    FLOOR(GREATEST(0, EXTRACT(EPOCH FROM (now() - r.started_at))) / 86400)::int AS days
                FROM rachas r
                ORDER BY days DESC
                LIMIT 300
            ) sub
        ), '[]'::json)
    );
END $$;

-- ── Locks ────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.admin_get_user_rachas(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_rachas_anon(text)       FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_user_rachas(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_rachas_anon(text)       TO service_role;

NOTIFY pgrst, 'reload schema';
