-- Red Solar Viva · CALIBRACIONES · acceso para administradores
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
--
-- BUG: las dos RPC del catalogo de Calibraciones (get_libreria_protocolos +
-- get_libreria_protocolos_for_routing) abren SOLO si get_my_membership_tier
-- devuelve 'sintonia' o 'inmersion'. Ese tier se calcula desde la tabla
-- subscriptions (no mira is_admin). Una cuenta ADMIN sin una fila de
-- suscripcion real (acceso comp por admin, o compra StoreKit/RevenueCat aun no
-- sincronizada a subscriptions) cae a tier 'explorer' -> las RPC devuelven []
-- -> el cliente carga libreriaProtos vacio -> la capa de Calibracion muestra
-- "opera por encima del umbral" / "Campo relacional sin lectura" para TODOS los
-- pilares aunque el Motor tenga 60 calibraciones activas. (El cliente si deja
-- entrar a la grilla porque su senal de miembro es por RevenueCat/admin.)
--
-- FIX: ademas de sintonia/inmersion, conceder acceso al contenido si el
-- llamante es is_admin. No debilita el muro de pago para invitados reales
-- (solo suma a los admins). Misma firma -> CREATE OR REPLACE.
--
-- Reproduce los cuerpos VIGENTES (20260608j) + el guard de admin.

-- B1) Catalogo completo de Calibraciones — miembros (sintonia/inmersion) O admin.
CREATE OR REPLACE FUNCTION public.get_libreria_protocolos(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tier text;
    v_is_admin boolean;
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    v_tier := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier');

    IF NOT COALESCE(v_is_admin, false)
       AND v_tier NOT IN ('sintonia', 'inmersion') THEN
        RETURN '[]'::json;  -- paywall: invitado no lee el contenido
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT id, pilar, fase, score_min, score_max, titulo,
                   descripcion_corta, alerta_text, sugerencia_text,
                   tareas_json, is_active
            FROM public.libreria_protocolos
            WHERE is_active = true
            ORDER BY pilar ASC, fase ASC
        ) t
    );
END $$;

-- B2) Ruteo del Enrutador (pilar + score) — miembros O admin.
CREATE OR REPLACE FUNCTION public.get_libreria_protocolos_for_routing(
    p_clerk_user_id text,
    p_pilar text,
    p_score int
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tier text;
    v_is_admin boolean;
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    v_tier := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier');

    IF NOT COALESCE(v_is_admin, false)
       AND v_tier NOT IN ('sintonia', 'inmersion') THEN
        RETURN '[]'::json;
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT *
            FROM public.libreria_protocolos
            WHERE pilar = p_pilar
              AND is_active = true
              AND score_min <= p_score
            ORDER BY score_min ASC
        ) t
    );
END $$;

-- Grants: solo el gateway (service_role) las invoca. REVOKE de anon (idempotente).
REVOKE ALL ON FUNCTION public.get_libreria_protocolos(text)                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_libreria_protocolos_for_routing(text, text, int)   FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_libreria_protocolos(text)                        TO service_role;
GRANT EXECUTE ON FUNCTION public.get_libreria_protocolos_for_routing(text, text, int) TO service_role;

NOTIFY pgrst, 'reload schema';
