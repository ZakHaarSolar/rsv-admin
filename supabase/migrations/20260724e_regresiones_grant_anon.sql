-- Red Solar Viva · AUDITORÍA 2026-07-24 · PARTE 2 · Regresiones GRANT-tras-REVOKE
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- NO requiere deploy de edges ni build de iOS (verificado: todos los clientes
-- vivos ya llaman por gateway; ver notas por bloque).
--
-- CÓMO SE HALLARON: cruce cronológico de TODOS los GRANT/REVOKE de las 279
-- migraciones. Una función cuyo ÚLTIMO evento por fecha de archivo es un
-- `GRANT ... TO anon` posterior a un `REVOKE` de una migración de auditoría
-- está REABIERTA. El patrón es el ya documentado en CLAUDE.md: un
-- `CREATE OR REPLACE` posterior re-otorga a anon lo que un REVOKE previo cerró.
--
-- Salieron 4 funciones. Se cierran las 4 aquí.


-- ═════════════════════════════════════════════════════════════════════════════
-- 1) get_wallpapers() — MURO DE PAGO DE ANCLAJES FOTÓNICOS BYPASSEADO  [ALTA]
-- ═════════════════════════════════════════════════════════════════════════════
-- Historia:
--   20260620_wallpapers / 20260620b : get_wallpapers() paramless, GRANT anon.
--   20260620o_wallpaper_paywall     : DROP de la paramless (su comentario dice
--                                     textual "cualquiera con la llave pública
--                                     bajaba los fondos premium gratis") y la
--                                     reemplaza por get_wallpapers(text)
--                                     member-aware, REVOKEd de anon.
--   20260704b_i18n_read_rpcs        : RE-CREA la paramless etiquetada "PÚBLICA"
--                                     (para agregarle title_en) y le hace
--                                     GRANT a anon.  <-- REABRE EL MURO.
--
-- Verificado EN VIVO (sonda anon, 2026-07-24): get_wallpapers() devuelve 10
-- wallpapers activos, de los cuales 8 son is_free=false, TODOS con su
-- `image_url` full-res de R2. El muro de Sintonía es decorativo desde el
-- 2026-07-04.
--
-- Por qué es seguro cerrarla YA (verificado en el cliente):
--   escaner-app/src/components/holoteca/WallpapersShell.tsx llama SIEMPRE por
--   gateway — `userAction(url, key, "get_wallpapers", {})` en sus DOS caminos
--   (prefetch L188 + carga del componente L374). El gateway inyecta
--   p_clerk_user_id → resuelve a la overload (text). NADIE llama la paramless:
--   es código huérfano desde el día que nació. Code/ tampoco (solo usa
--   admin_get_wallpapers, que es otra función).
DROP FUNCTION IF EXISTS public.get_wallpapers();

-- BONUS (bug de i18n, no de seguridad): 20260704b quería que los wallpapers
-- tuvieran título en inglés y agregó `title_en` … a la overload MUERTA. El
-- cliente lee `w.title_en || w.title` (WallpapersShell L134), así que hoy los
-- títulos en inglés NO funcionan y caen siempre al español. Se agrega title_en
-- a la overload VIVA (la member-aware) para que el i18n haga lo que debía.
-- Aditivo: el cliente ya tiene el respaldo `|| w.title`, así que no requiere build.
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
        'title_en', title_en,            -- i18n en la overload VIVA
        -- URL full-res SOLO para gratis o miembro; bloqueado → null (sin fuga).
        'image_url', CASE WHEN is_free OR v_member THEN image_url ELSE NULL END,
        'is_free', is_free,
        'locked', NOT (is_free OR v_member),
        'sort_order', sort_order,
        'category_id', category_id
    ) ORDER BY sort_order, created_at), '[]'::json)
    INTO result
    FROM wallpapers
    WHERE active;

    RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_wallpapers(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_wallpapers(text) TO service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- 2) Familia Atelier reabierta — IDOR con p_admin_clerk_id forjable   [MEDIA]
-- ═════════════════════════════════════════════════════════════════════════════
--   get_zakhaar_carousels_admin : REVOKEd por 20260620n → re-GRANTed por
--                                 20260623_zakhaar_dialogo_mode y 20260624_codices_luz.
--   get_recent_vtli_drafts      : REVOKEd por 20260613d → re-GRANTed por
--   get_vtli_drafts_by_ids        20260710_vtli_episodios.
--
-- Las tres SÍ tienen chequeo de admin dentro (sonda anon con id falso →
-- {"error":"unauthorized"}), así que NO es una fuga abierta: es el mismo IDOR
-- de identidad-por-parámetro que la ola C cerró — quien conozca un clerk id de
-- admin lee todo el Atelier (storyboards, carruseles, copy sin publicar).
-- Defensa en profundidad: el gateway es el único que debe poder ejecutarlas.
--
-- Por qué es seguro cerrarlas YA (verificado):
--   Los paneles Code/AT_ZakHaarCarrusel.tsx y Code/AT_EstudioManual.tsx usan el
--   helper rpc() gateway-first (intenta admin-action con el token de Clerk y
--   solo cae a REST directo si el gateway falla — el comentario del propio
--   helper dice "fallback transitorio … hasta el REVOKE"). Las tres acciones
--   están en la whitelist de admin-action/index.ts (L153, L159, L166), así que
--   tras el REVOKE el camino del gateway sigue vivo y el fallback muere.
DO $$
DECLARE
    fn   text;
    args text;
BEGIN
    FOREACH fn IN ARRAY ARRAY[
        'get_zakhaar_carousels_admin',
        'get_recent_vtli_drafts',
        'get_vtli_drafts_by_ids'
    ] LOOP
        -- Resuelve TODAS las firmas (por si hay overloads de versiones viejas).
        FOR args IN
            SELECT pg_get_function_identity_arguments(p.oid)
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = fn
        LOOP
            EXECUTE format(
                'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                fn, args);
            EXECUTE format(
                'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',
                fn, args);
            RAISE NOTICE 'cerrada: %(%)', fn, args;
        END LOOP;
    END LOOP;
END $$;


NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (opcional, desde la raíz del repo):
--   python3 admin/audit_verify.py
-- Esperado tras pegar:
--   get_zakhaar_carousels_admin (B2)  http=401  CLOSED ✓   (hoy ALARM 🔴)
--   get_wallpapers()                  http=401 / 404        (bloque nuevo)
-- ═════════════════════════════════════════════════════════════════════════════
