-- 20260813_voz_frases_borrar.sql
-- ════════════════════════════════════════════════════════════════════
-- ELIMINAR FRASES DEL PANEL DE VOZ (Motor → "Voz")
--
-- Zak (2026-08-13): probó el orbe con una frase que la voz no podía
-- ejecutar; la frase aterrizó bien en el panel, y ahora hace falta poder
-- RETIRAR entradas de ahí — pruebas propias, ruido, o carencias ya
-- convertidas en ejemplos del prompt. Sin esto la lista solo crece y las
-- frases ya atendidas se mezclan con las pendientes.
--
-- El panel agrupa por texto normalizado (lower(trim())), así que el
-- borrado recibe TEXTOS y barre todas las filas cuyo texto normalizado
-- coincida — la entrada desaparece entera, en todas las ventanas.
-- Mismo gate y mismos permisos que admin_voz_frases_top: is_admin +
-- EXECUTE solo para service_role (la edge admin-action es la única puerta).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_voz_frases_borrar(
    p_admin_clerk_id text,
    p_textos         text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin    boolean;
    v_borradas int;
BEGIN
    SELECT COALESCE(is_admin, false) INTO v_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_admin, false) THEN
        RETURN json_build_object('error', 'forbidden');
    END IF;

    IF p_textos IS NULL OR array_length(p_textos, 1) IS NULL THEN
        RETURN json_build_object('error', 'sin_textos');
    END IF;

    DELETE FROM public.voz_frases_sin_resolver
    WHERE lower(trim(texto)) = ANY (
        SELECT lower(trim(t)) FROM unnest(p_textos) AS t
    );
    GET DIAGNOSTICS v_borradas = ROW_COUNT;

    RETURN json_build_object('ok', true, 'borradas', v_borradas);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_voz_frases_borrar(text, text[])
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_voz_frases_borrar(text, text[])
    TO service_role;
