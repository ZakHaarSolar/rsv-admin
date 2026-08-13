-- Red Solar Viva · get_tripulante_platforms — QUÉ APARATO USA CADA NODO
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Qué hace: una RPC NUEVA e independiente que dice si un Tripulante abre la
-- app en iPhone, en Android o desde el navegador. El Motor → Nodos Activos
-- ya mostraba la versión de la app de cada nodo; faltaba lo más básico.
--
-- 🜂 POR QUÉ UNA RPC APARTE y no una columna más en get_tripulante_extras:
-- esa función es larga y devuelve trece cosas de las que depende TODA la
-- ficha del nodo (membresía, compras, escaneos, versión). Reescribirla para
-- colgarle un campo obliga a reproducir su cuerpo entero, y un solo nombre
-- de tabla o columna mal copiado deja la ficha en blanco. Esta va sola, se
-- pide en paralelo, y si algún día falla lo único que se pierde es la
-- etiqueta del aparato.
--
-- DE DÓNDE SALE. De dos fuentes unidas, porque ninguna sola cubre a todos:
--   · push_tokens.platform  — exacto, pero solo de quien aceptó avisos.
--   · nav_events.platform   — lo escribe CUALQUIER navegación dentro de la
--                             app, así que cubre a casi todo el que la abrió.
-- Se normaliza a 'ios' | 'android' | 'web' y se devuelve la lista distinta
-- con el nativo primero (a un admin le importa más "tiene la app" que
-- "entró por el navegador"). Vacío = nunca abrió la app, o es anterior a
-- esta telemetría.

CREATE OR REPLACE FUNCTION public.get_tripulante_platforms(
    target_clerk_id TEXT,
    admin_clerk_id  TEXT
)
RETURNS TABLE (platforms TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    /* Mismo portón de admin que el resto del Motor. */
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = admin_clerk_id
          AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    WITH vistos AS (
        SELECT LOWER(TRIM(pt.platform)) AS p
        FROM push_tokens pt
        WHERE pt.clerk_user_id = target_clerk_id
          AND COALESCE(TRIM(pt.platform), '') <> ''
        UNION
        SELECT LOWER(TRIM(ne.platform)) AS p
        FROM nav_events ne
        WHERE ne.clerk_user_id = target_clerk_id
          AND COALESCE(TRIM(ne.platform), '') <> ''
    ),
    norm AS (
        SELECT DISTINCT
            CASE
                WHEN v.p IN ('ios', 'iphone', 'ipad')     THEN 'ios'
                WHEN v.p IN ('android')                   THEN 'android'
                WHEN v.p IN ('web', 'desktop', 'browser') THEN 'web'
                ELSE v.p
            END AS p
        FROM vistos v
    )
    SELECT COALESCE(
        (SELECT string_agg(n.p, ',' ORDER BY
            CASE n.p
                WHEN 'ios'     THEN 1
                WHEN 'android' THEN 2
                WHEN 'web'     THEN 3
                ELSE 4
            END)
         FROM norm n),
        ''
    );
END;
$$;

-- Solo el gateway admin-action (service_role) la ejecuta; anon directo → 401.
REVOKE EXECUTE ON FUNCTION public.get_tripulante_platforms(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_tripulante_platforms(TEXT, TEXT)
    TO service_role;
