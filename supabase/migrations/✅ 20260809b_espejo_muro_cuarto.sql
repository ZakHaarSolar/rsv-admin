-- 🜂 EL CUARTO INTENTO DEL ESPEJO — quién QUISO seguir
-- ---------------------------------------------------------------------------
-- Zak (2026-08-09): "mandó 3 reflejos" y "quiso mandar el cuarto" son dos
-- personas distintas, y hasta ahora solo se podía ver la primera. Su hermano
-- gastó sus tres y nadie supo si intentó el cuarto o simplemente se fue.
--
-- Dónde se anota: en `oraculo_usage`, que ya es la ficha de uso del Espejo por
-- persona (ahí vive `sent_count`). Dos columnas y nada más.
--
-- 🜂 POR QUÉ NO EN nav_events: esa tabla se PURGA a los 7 días por diseño
-- (retención corta a propósito). El muro es un hecho que define a esa persona
-- en el embudo, no un evento de navegación de la semana: tiene que durar.
--
-- 🜂 POR QUÉ LO ESCRIBE EL SERVIDOR Y NO LA APP: el servidor es quien DECIDE
-- cortar (oraculo-chat devuelve gated). Anotarlo ahí lo vuelve imposible de
-- falsear desde el cliente y no depende de que la app esté al día.
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.
-- ---------------------------------------------------------------------------

ALTER TABLE public.oraculo_usage
    ADD COLUMN IF NOT EXISTS muro_intentos int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS muro_first_at timestamptz,
    ADD COLUMN IF NOT EXISTS muro_last_at  timestamptz;

COMMENT ON COLUMN public.oraculo_usage.muro_intentos IS
'Cuántas veces esta persona intentó enviar un reflejo YA agotados sus 3 de cortesía (el muro de Sintonía). Lo escribe oraculo-chat con service_role en el mismo punto donde corta.';

-- ── Registrar un topón contra el muro (la llama la edge con service_role) ──
CREATE OR REPLACE FUNCTION public.registrar_muro_espejo(p_clerk_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN;
    END IF;
    INSERT INTO oraculo_usage (clerk_user_id, muro_intentos, muro_first_at, muro_last_at)
    VALUES (p_clerk_user_id, 1, now(), now())
    ON CONFLICT (clerk_user_id) DO UPDATE
        SET muro_intentos = oraculo_usage.muro_intentos + 1,
            muro_first_at = COALESCE(oraculo_usage.muro_first_at, now()),
            muro_last_at  = now();
END $$;

-- ── Leerlo en la ficha del nodo (Motor → Nodos Activos) ───────────────────
CREATE OR REPLACE FUNCTION public.admin_get_espejo_muro(
    p_admin_clerk_id  text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_int   int;
    v_first timestamptz;
    v_last  timestamptz;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE clerk_user_id = p_admin_clerk_id AND is_admin
    ) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(muro_intentos, 0), muro_first_at, muro_last_at
      INTO v_int, v_first, v_last
      FROM oraculo_usage
     WHERE clerk_user_id = p_target_clerk_id;

    RETURN json_build_object(
        'success', true,
        'intentos', COALESCE(v_int, 0),
        'primero',  v_first,
        'ultimo',   v_last
    );
END $$;

-- ── Locks ────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.registrar_muro_espejo(text)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_espejo_muro(text, text)        FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_muro_espejo(text)           TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_espejo_muro(text, text)     TO service_role;

NOTIFY pgrst, 'reload schema';
