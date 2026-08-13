-- Red Solar Viva · GASTO DE IA POR NODO (Zak 2026-08-05)
-- ============================================================================
-- Panel: Telemetría del Núcleo → sección "Gasto de IA por nodo" (TN_Dashboard
-- v1.6). Lee el libro mayor REAL del gobernador de gasto (edge_spend_ledger,
-- migración 20260612e) y lo agrega por usuario en tres ventanas (hoy · 7 días
-- · 30 días) por superficie:
--   · Reflejos  = edge 'oraculo-dia'      (1 fila por reflejo)
--   · Visión    = edge 'oraculo-vision'   (1 fila por lectura de imagen)
--   · Voz       = edge 'espejo-voz-mes'   (cost_units = unidades de 1.000
--                 caracteres; se cuenta SOLO la ventana mensual para no
--                 duplicar con la fila hermana de la ventana diaria)
--   · Decodifs  = edges 'decode%' + 'extract-text' (Materia / Sueños / OCR)
-- El costo USD 30d usa los MISMOS precios unitarios del panel de IAs del
-- Motor: reflejo $0.0025 · visión $0.01 · voz $0.0156/unidad · deco ≈ $0.004.
-- Gate: profiles.is_admin (mismo patrón que get_1to1_revenue_summary).
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.get_ia_gasto_por_nodo(p_clerk_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_rows     jsonb;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM profiles
    WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not_admin';
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.usd_30 DESC), '[]'::jsonb)
      INTO v_rows
    FROM (
        SELECT
            l.user_key,
            COALESCE(MAX(p.full_name), '')                                                                                     AS nombre,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'    AND l.created_at > now() - interval '1 day'),  0)::int AS refl_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'    AND l.created_at > now() - interval '7 days'), 0)::int AS refl_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'),                                                 0)::int AS refl_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision' AND l.created_at > now() - interval '1 day'),  0)::int AS vis_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision' AND l.created_at > now() - interval '7 days'), 0)::int AS vis_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision'),                                              0)::int AS vis_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '1 day'),  0)::int AS voz_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '7 days'), 0)::int AS voz_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),                                              0)::int AS voz_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'),                       0)::int AS deco_30,
            ROUND((
                COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'),    0) * 0.0025
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision'), 0) * 0.01
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'), 0) * 0.0156
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'), 0) * 0.004
            )::numeric, 4)                                                                                                    AS usd_30
        FROM edge_spend_ledger l
        LEFT JOIN profiles p ON p.clerk_user_id = l.user_key
        WHERE l.user_key IS NOT NULL
          AND l.created_at > now() - interval '30 days'
        GROUP BY l.user_key
        ORDER BY usd_30 DESC
        LIMIT 300
    ) t;

    RETURN jsonb_build_object('nodos', v_rows, 'generado', now());
END;
$$;

REVOKE ALL ON FUNCTION public.get_ia_gasto_por_nodo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ia_gasto_por_nodo(text) TO anon, authenticated, service_role;
