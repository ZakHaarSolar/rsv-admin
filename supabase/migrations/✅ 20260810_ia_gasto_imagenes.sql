-- Red Solar Viva · GASTO DE IA POR NODO — ENTRAN LAS IMÁGENES (Zak 2026-08-10)
-- ============================================================================
-- Reemplaza get_ia_gasto_por_nodo (20260805) sumando las DOS superficies que
-- generan imágenes y que hasta hoy no entraban a la telemetría ni al costo:
--
--   · Imagen · Espejo   = edge 'espejo-imagen'         (FLUX.2 Pro, $0.03)
--   · Imagen · Ráfaga   = edge 'espejo-imagen-rafaga'  (FLUX Schnell, $0.003)
--
-- 🜂 POR QUÉ IMPORTA: la edge espejo-imagen lo dejó anotado en su cabecera
-- ("por ahora el costo es tan bajo que viaja fuera del USD 30d"). Eso era
-- cierto con una imagen por reflejo; el Modo Ráfaga pide 2 o 3 por envío con
-- cupo de 30 al día, así que el volumen ya no es despreciable y además es la
-- superficie que Zak quiere medir antes de abrirla a los Tripulantes.
--
-- 🜂 QUÉ **NO** ES "VISIÓN": la columna Visión ('oraculo-vision') cuenta las
-- imágenes que el Espejo MIRA cuando alguien le manda una foto. No tiene nada
-- que ver con generar. Por eso las dos columnas nuevas son aparte y Visión se
-- queda intacta: son tres cosas distintas con tres precios distintos.
--
-- Los dos carriles se separan por igualdad EXACTA de la llave, no por LIKE:
-- 'espejo-imagen' y 'espejo-imagen-rafaga' son llaves hermanas y un LIKE
-- 'espejo-imagen%' mezclaría las dos (y con ellas $0.03 contra $0.003).
--
-- Precios unitarios: los MISMOS del panel de IAs del Motor (MI_IAs.tsx).
-- Gate: profiles.is_admin. Contrato de salida: aditivo — las claves viejas
-- siguen ahí con el mismo nombre, así que un cliente sin actualizar no rompe.
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
            -- NUEVO · imágenes generadas por el Espejo original (FLUX.2 Pro)
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'  AND l.created_at > now() - interval '1 day'),  0)::int AS img_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'  AND l.created_at > now() - interval '7 days'), 0)::int AS img_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'),                                               0)::int AS img_30,
            -- NUEVO · imágenes del Modo Ráfaga (FLUX Schnell, cupo propio)
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga' AND l.created_at > now() - interval '1 day'),  0)::int AS raf_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga' AND l.created_at > now() - interval '7 days'), 0)::int AS raf_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga'),                                              0)::int AS raf_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '1 day'),  0)::int AS voz_1,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes' AND l.created_at > now() - interval '7 days'), 0)::int AS voz_7,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),                                              0)::int AS voz_30,
            COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge LIKE 'decode%' OR l.edge = 'extract-text'),                       0)::int AS deco_30,
            ROUND((
                COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-dia'),           0) * 0.0025
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'oraculo-vision'),        0) * 0.01
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen'),         0) * 0.03
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-imagen-rafaga'),  0) * 0.003
              + COALESCE(SUM(l.cost_units) FILTER (WHERE l.edge = 'espejo-voz-mes'),        0) * 0.0156
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
