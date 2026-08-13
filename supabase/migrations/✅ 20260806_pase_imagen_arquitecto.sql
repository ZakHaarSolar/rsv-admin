-- Red Solar Viva · PASE DE IMÁGENES DEL ARQUITECTO (Zak 2026-08-06)
-- ============================================================================
-- El Reflejo ilustrado tiene tope comercial de 2 imágenes/día por persona
-- (espejo-imagen v2.1, FLUX.2 Pro $0.03 c/u). Este pase permite a Zak darse
-- MÁS imágenes para probar, desde el Motor → IAs, sin tocar el tope de nadie.
--
-- 🜂 BLINDAJE DOBLE, por pedido explícito de Zak ("únicamente a
--    cuerpodeluz555@gmail.com, no a nadie más"):
--      1. Quien LLAMA debe ser admin (profiles.is_admin).
--      2. El pase SIEMPRE se otorga al dueño de ese correo — la RPC no
--         recibe destinatario, así que ni el propio panel puede dárselo a
--         otra cuenta aunque alguien manipule el cliente.
--    El pase vive UN DÍA (columna `dia`): al día siguiente vuelve el tope
--    normal solo, sin tener que acordarse de apagarlo.
--
-- Pegar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE TABLE IF NOT EXISTS ia_pase_imagen (
    clerk_user_id text        NOT NULL,
    dia           date        NOT NULL DEFAULT CURRENT_DATE,
    extra         int         NOT NULL DEFAULT 0,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, dia)
);

ALTER TABLE ia_pase_imagen ENABLE ROW LEVEL SECURITY;  -- sin policies → solo service_role

-- Otorga (o reemplaza) el pase del día para la cuenta del Arquitecto.
-- p_n = total de imágenes EXTRA para hoy (0 lo retira).
CREATE OR REPLACE FUNCTION public.admin_grant_image_pass(
    p_clerk_id text,
    p_n        int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_target   text;
    v_n        int := GREATEST(0, LEAST(COALESCE(p_n, 0), 200));
BEGIN
    -- 1. Quien llama debe ser admin.
    SELECT is_admin INTO v_is_admin
    FROM profiles
    WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not_admin';
    END IF;

    -- 2. El destinatario es SIEMPRE la cuenta del Arquitecto, nunca un parámetro.
    SELECT clerk_user_id INTO v_target
    FROM profiles
    WHERE lower(email) = 'cuerpodeluz555@gmail.com'
    LIMIT 1;

    IF v_target IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'cuenta_no_encontrada');
    END IF;

    IF v_n = 0 THEN
        DELETE FROM ia_pase_imagen
        WHERE clerk_user_id = v_target AND dia = CURRENT_DATE;
        RETURN jsonb_build_object('ok', true, 'extra', 0, 'dia', CURRENT_DATE);
    END IF;

    INSERT INTO ia_pase_imagen (clerk_user_id, dia, extra, updated_at)
    VALUES (v_target, CURRENT_DATE, v_n, now())
    ON CONFLICT (clerk_user_id, dia)
    DO UPDATE SET extra = EXCLUDED.extra, updated_at = now();

    RETURN jsonb_build_object('ok', true, 'extra', v_n, 'dia', CURRENT_DATE);
END;
$$;

-- Lectura del pase vigente (para que el panel muestre el estado).
CREATE OR REPLACE FUNCTION public.admin_get_image_pass(p_clerk_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_extra    int;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not_admin';
    END IF;

    SELECT p.extra INTO v_extra
    FROM ia_pase_imagen p
    JOIN profiles pr ON pr.clerk_user_id = p.clerk_user_id
    WHERE lower(pr.email) = 'cuerpodeluz555@gmail.com'
      AND p.dia = CURRENT_DATE
    LIMIT 1;

    RETURN jsonb_build_object('extra', COALESCE(v_extra, 0), 'base', 2);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_image_pass(text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_image_pass(text)        FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_image_pass(text, int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_image_pass(text)        TO anon, authenticated, service_role;
