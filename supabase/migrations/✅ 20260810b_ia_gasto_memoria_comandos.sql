-- Red Solar Viva · GASTO DE IA POR NODO — CIERRA EL TOTAL (Zak 2026-08-10)
-- ============================================================================
-- Segunda pasada sobre get_ia_gasto_por_nodo, después de 20260810_ia_gasto_
-- imagenes.sql. Suma las dos superficies que faltaban para que el número del
-- panel sea el gasto REAL de IA y no una parte:
--
--   · 🧠 Memoria  = edge 'espejo-memoria'  (destilador del Espejo, cron 4h)
--                   deepseek-v4-flash · 0.045 MXN por destilación = $0.0025 USD
--                   tope 8/día por persona · 400/día global
--   · 🎙 Comandos = edge 'voz-intent'      (intérprete de los comandos por voz)
--                   llama-3.1-8b para navegar · llama-3.3-70b para actuar
--                   $0.0002 navegar / $0.00239 actuar → $0.001 mezclado
--                   tope 240/día por persona · 20.000/día global
--
-- Los dos ya escribían al libro mayor con p_user_key = clerk id y p_cost = 1,
-- así que no hace falta tocar ninguna edge: solo había que leerlos.
--
-- 🜂 PRECIOS ESTIMADOS, A PROPÓSITO. Memoria sale del propio comentario del
-- destilador (0,045 MXN por destilación). Comandos es una MEZCLA: el mismo edge
-- corre un modelo de 8b para navegar y uno de 70b para actuar, y el libro mayor
-- no distingue cuál corrió. $0.001 queda entre los dos y sobreestima el caso
-- común (navegar es lo que más se usa). Si algún día importa la diferencia, se
-- separa en la edge escribiendo dos llaves distintas; hoy no vale el cambio.
--
-- Contrato aditivo: las claves viejas conservan nombre y tipo.
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
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'  AND l.created_at > now() - interval '1 day'),  0)::int AS img_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'  AND l.created_at > now() - interval '7 days'), 0)::int AS img_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'),                                               0)::int AS img_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga' AND l.created_at > now() - interval '1 day'),  0)::int AS raf_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga' AND l.created_at > now() - interval '7 days'), 0)::int AS raf_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga'),                                              0)::int AS raf_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '1 day'),  0)::int AS voz_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '7 days'), 0)::int AS voz_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),                                              0)::int AS voz_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'),                       0)::int AS deco_30,
            -- NUEVO · destilador de memoria del Espejo
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-memoria'),                                              0)::int AS mem_30,
            -- NUEVO · intérprete de los comandos por voz
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'voz-intent'),                                                  0)::int AS cmd_30,
            ROUND((
                COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'),           0) * 0.0025
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision'),        0) * 0.01
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'),         0) * 0.03
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga'),  0) * 0.003
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),        0) * 0.0156
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'), 0) * 0.004
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-memoria'),        0) * 0.0025
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'voz-intent'),            0) * 0.001
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


-- ── DIAGNÓSTICO (opcional, solo lee) ────────────────────────────────────────
-- Si alguna columna sale en cero y creés que no debería, esto muestra qué
-- llaves EXISTEN de verdad en el libro mayor de los últimos 30 días. Si una
-- llave no aparece acá, el problema está en la edge que no la escribe, no en
-- el panel que no la lee.
--
--   SELECT edge, COUNT(*) AS filas, SUM(cost_units) AS unidades,
--          COUNT(DISTINCT user_key) AS nodos, MAX(created_at) AS ultima
--   FROM edge_spend_ledger
--   WHERE created_at > now() - interval '30 days'
--   GROUP BY edge
--   ORDER BY unidades DESC;
