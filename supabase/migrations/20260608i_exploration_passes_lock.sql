-- Red Solar Viva · Barrido profundo (paso 2) — cerrar FUGA DE PII de exploration_passes
-- =====================================================================
-- HALLAZGO (sonda anon en vivo 2026-06-08 IV): `exploration_passes` estaba
-- ABIERTA a anon — `select=*` con la anon key devolvía email + nombre + fecha
-- de sesión + calendly_uri de TODOS los clientes de Cámara Solar grupal, EN
-- BLOQUE, sin filtro ni id. Fuga de PII masiva, severidad ALTA. No estaba en
-- el audit previo.
--
-- Único lector directo en TODO el código: `TN_Shared.useExplorationPasses`
-- (panel admin web — cuenta pases del mes y del mes previo para la Telemetría
-- del Núcleo). iOS NO la lee → este cierre NO depende de la build.
--
-- Cierre en 2 partes:
--   1) RPC admin-gated que devuelve SOLO los dos conteos (sin PII), invocada
--      por el gateway `admin-action` (gateAdmin verifica el token de Clerk del
--      admin e inyecta p_admin_clerk_id). Doble check: la RPC revalida is_admin.
--   2) Lock de la tabla: ENABLE RLS + REVOKE de anon/authenticated/PUBLIC.
--      service_role (Pipedream Ignicion/Compras + webhooks de booking) la
--      sigue escribiendo/leyendo: BYPASSRLS + grant propio, no lo afecta.
--   Mismo patrón verificado que cerró subscriptions/purchases (→ 401 a anon).

-- ── 1) RPC admin-gated: conteo de pases mes actual / mes previo (UTC) ────
CREATE OR REPLACE FUNCTION public.admin_exploration_pass_counts(
    p_admin_clerk_id text
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin   boolean;
    v_this_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC');
    v_next_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month';
    v_prev_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') - interval '1 month';
    v_this int;
    v_prev int;
BEGIN
    -- Doble blindaje (el gateway ya verificó is_admin con el token).
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'no autorizado' USING ERRCODE = '42501';
    END IF;

    SELECT count(*) INTO v_this
    FROM public.exploration_passes
    WHERE created_at >= v_this_start AND created_at < v_next_start;

    SELECT count(*) INTO v_prev
    FROM public.exploration_passes
    WHERE created_at >= v_prev_start AND created_at < v_this_start;

    RETURN json_build_object('this_month', v_this, 'prev_month', v_prev);
END $$;

REVOKE ALL ON FUNCTION public.admin_exploration_pass_counts(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exploration_pass_counts(text) TO service_role;

-- ── 2) Lock de la tabla: anon ya no lee NI escribe exploration_passes ────
ALTER TABLE public.exploration_passes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exploration_passes FROM PUBLIC, anon, authenticated;
-- service_role conserva su grant (Pipedream + webhooks de booking siguen).
GRANT ALL ON public.exploration_passes TO service_role;
