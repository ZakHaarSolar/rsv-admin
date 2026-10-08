-- 20261008b_wallpapers_muro_y_recientes.sql · 🜂 LOS ANCLAJES DE PAGA VUELVEN A
-- CERRARSE Y RECIENTES RECIBE SU FECHA (2026-10-08)
-- ─────────────────────────────────────────────────────────────────────────────
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- No requiere desplegar funciones ni versión nueva de la app: el portón
-- user-action ya llama a get_wallpapers(text) y el cliente (WallpapersShell
-- v1.22 en adelante) ya lee created_at cuando llega.
--
-- EL HUECO (verificado en vivo el 2026-10-08 con la sola llave pública):
--   POST /rest/v1/rpc/get_wallpapers con body {} respondía 200 con los 10
--   fondos activos y su image_url completa de R2, incluidos los 8 de paga
--   (is_free = false). El muro de Sintonía de los Anclajes era decorativo.
--   La tabla en sí está bien cerrada (RLS sin policies: GET /wallpapers da []);
--   la única puerta era esta función.
--
-- LA HISTORIA (es la tercera vez del mismo patrón):
--   20260620o  borró get_wallpapers() sin parámetros por filtrar los fondos de
--              paga; la única quedó get_wallpapers(text), que sabe de membresía.
--   20260704b  la re-creó para sumar title_en, con GRANT a anon.
--   20260724e  la volvió a borrar y pasó title_en a la versión viva.
--   20260825b  la re-creó OTRA VEZ para sumar created_at, con GRANT a anon.
--   Las dos veces el campo nuevo cayó en la versión que nadie llama, así que
--   la pestaña Recientes y el sello NUEVO nunca recibieron fecha.
--
-- QUIÉN USA LA VERSIÓN SIN PARÁMETROS (revisado el 2026-10-08): nadie.
--   escaner-app: WallpapersShell y sinConexionPrecalentar piden el catálogo
--     con userAction(..., "get_wallpapers", {}); el portón inyecta el id
--     verificado y resuelve a get_wallpapers(text). El paquete 1.1.5 archivado
--     hace lo mismo.
--   Code/: solo admin_get_wallpapers (por admin-action).
--   rsv-web/, escaner-landing/ y los demás proyectos: ninguna referencia.
--
-- QUÉ HACE:
--   1) DROP de get_wallpapers() sin parámetros. El mismo POST anónimo
--      responde 404.
--   2) get_wallpapers(text) suma created_at. El resto es la definición de
--      20260724e tal cual: URL completa solo para gratis o miembro (Sintonía
--      o Inmersión); los bloqueados llegan con image_url = null y locked = true.
--   3) Permisos: solo service_role (el portón).
--   4) Un candado: si al final alguna get_wallpapers quedara abierta a anon o
--      authenticated, la viva no trajera created_at, o alguien sin membresía
--      recibiera la URL de un fondo de paga, se lanza un error y no se aplica
--      nada.
--   5) La última consulta deja UNA fila en Results para revisar a ojo:
--      get_wallpapers(text) | false | true | true
--
-- 🜂 PARA LA PRÓXIMA SALA: get_wallpapers NO tiene versión pública. Cualquier
--    campo nuevo de la galería va en get_wallpapers(text). Nunca crear
--    get_wallpapers() ni darle GRANT a anon o authenticated.


-- 1) Fuera la versión pública.
DROP FUNCTION IF EXISTS public.get_wallpapers();


-- 2) La versión viva suma created_at (definición de 20260724e + un campo).
CREATE OR REPLACE FUNCTION public.get_wallpapers(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member boolean;
    result json;
BEGIN
    v_member := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier')
                IN ('sintonia', 'inmersion');

    SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'title_en', title_en,
        -- URL full-res SOLO para gratis o miembro; bloqueado → null (sin fuga).
        'image_url', CASE WHEN is_free OR v_member THEN image_url ELSE NULL END,
        'is_free', is_free,
        'locked', NOT (is_free OR v_member),
        'sort_order', sort_order,
        'category_id', category_id,
        'created_at', created_at         -- Recientes y el sello NUEVO
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM wallpapers
    WHERE active;

    RETURN result;
END;
$$;


-- 3) Solo el portón la invoca.
REVOKE EXECUTE ON FUNCTION public.get_wallpapers(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_wallpapers(text) TO service_role;

COMMENT ON FUNCTION public.get_wallpapers(text) IS
    'Catálogo de Anclajes Fotónicos con muro de membresía. Es la ÚNICA versión: la llama el portón user-action (service_role). No crear get_wallpapers() sin parámetros ni darle GRANT a anon: filtra las URLs de los fondos de paga (20260620o, 20260724e, 20261008b).';


-- 4) El candado: si algo quedó mal, nada de lo anterior se aplica.
DO $$
DECLARE
    f        record;
    v_sample json;
BEGIN
    IF to_regprocedure('public.get_wallpapers()') IS NOT NULL THEN
        RAISE EXCEPTION 'get_wallpapers() sin parámetros sigue existiendo';
    END IF;

    FOR f IN
        SELECT p.oid, p.oid::regprocedure AS firma
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'get_wallpapers'
    LOOP
        IF has_function_privilege('anon', f.oid, 'EXECUTE')
           OR has_function_privilege('authenticated', f.oid, 'EXECUTE') THEN
            RAISE EXCEPTION '% sigue abierta a la llave pública', f.firma;
        END IF;
    END LOOP;

    -- Sin cuenta ('' = explorer): ningún fondo de paga puede traer su URL.
    v_sample := public.get_wallpapers('');
    IF EXISTS (
        SELECT 1
        FROM json_array_elements(v_sample) e
        WHERE NOT COALESCE((e ->> 'is_free')::boolean, false)
          AND (e ->> 'image_url') IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'un Tripulante sin membresía recibe la URL de un fondo de paga';
    END IF;

    IF json_array_length(v_sample) > 0
       AND (v_sample -> 0 -> 'created_at') IS NULL THEN
        RAISE EXCEPTION 'get_wallpapers(text) no devuelve created_at';
    END IF;
END $$;


NOTIFY pgrst, 'reload schema';


-- 5) Para revisar a ojo en Results. Esperado, UNA fila:
--    get_wallpapers(text) | false | true | true
SELECT
    p.oid::regprocedure                                           AS funcion,
    has_function_privilege('anon', p.oid, 'EXECUTE')              AS abierta_a_la_llave_publica,
    has_function_privilege('service_role', p.oid, 'EXECUTE')      AS la_llama_el_porton,
    (public.get_wallpapers('') -> 0 -> 'created_at') IS NOT NULL  AS trae_fecha_de_alta
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'get_wallpapers';
