-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Observatorio · fixes post-QA (2026-04-24)
--
--   1. get_citas_1to1_de_tripulante acepta p_email opcional y hace OR.
--      (Sesión nueva puede cerrar con email sin clerk_user_id aún
--      populado — ej. Stripe webhook confirmó antes del rehidratado
--      en Clerk.)
--   2. get_preguntas_1a1_activas incluye `activa` en el SELECT.
--   3. upsert_preguntas_1to1_admin ahora soporta hasta 5 preguntas
--      y devuelve la lista actualizada en la misma llamada (evita
--      race condition del refetch). Desactiva las que quedan fuera
--      del payload (pone activa=FALSE) para mantener la colección
--      consistente con lo que el Arquitecto edita.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. get_citas_1to1_de_tripulante — OR por email
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_citas_1to1_de_tripulante(
    p_clerk_user_id TEXT,
    p_email         TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
BEGIN
    IF p_clerk_user_id IS NULL AND v_email = '' THEN
        RETURN '[]'::json;
    END IF;

    RETURN COALESCE((
        SELECT json_agg(row_to_json(c) ORDER BY c.start_time)
        FROM (
            SELECT
                r.id                    AS reserva_id,
                r.status,
                r.confirmed_at,
                r.name,
                r.email,
                r.amount_mxn_cents,
                r.zoom_join_url,
                r.zoom_meeting_id,
                r.zoom_password,
                r.zoom_used_fallback,
                r.escaneo_resultado,
                r.intencion_texto,
                r.escaneo_completado_at,
                a.id                    AS slot_id,
                a.slot_type,
                a.start_time,
                a.end_time
            FROM public.reservas r
            INNER JOIN public.asientos_reservados a ON a.id = r.asiento_id
            WHERE r.status = 'confirmada'
              AND a.slot_type LIKE 'individual_%'
              AND a.start_time >= NOW() - INTERVAL '2 hours'
              AND (
                    (p_clerk_user_id IS NOT NULL AND r.clerk_user_id = p_clerk_user_id)
                    OR
                    (v_email <> '' AND LOWER(r.email) = v_email)
              )
            ORDER BY a.start_time ASC
        ) c
    ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_citas_1to1_de_tripulante(TEXT, TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 2. get_preguntas_1a1_activas — incluye activa
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_preguntas_1a1_activas()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN COALESCE((
        SELECT json_agg(row_to_json(q) ORDER BY q.orden)
        FROM (
            SELECT id, orden, pregunta_texto, opciones, plano_label, activa
            FROM public.config_preguntas_1a1
            WHERE activa = TRUE
            ORDER BY orden
        ) q
    ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_preguntas_1a1_activas() TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 3. upsert_preguntas_1to1_admin — hasta 5 preguntas + return list
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_preguntas_1to1_admin(
    p_clerk_id  TEXT,
    p_preguntas JSONB
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin  BOOLEAN;
    v_p         JSONB;
    v_keep      INT[] := ARRAY[]::INT[];
    v_count     INT;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    IF jsonb_typeof(p_preguntas) <> 'array' THEN
        RETURN json_build_object('error','not_array');
    END IF;

    v_count := jsonb_array_length(p_preguntas);
    IF v_count > 5 THEN
        RETURN json_build_object('error','too_many','detail','Máximo 5 preguntas.');
    END IF;

    FOR v_p IN SELECT * FROM jsonb_array_elements(p_preguntas) LOOP
        -- Skip entradas sin texto (slots vacíos) — no las upserteamos
        IF COALESCE(TRIM(v_p->>'pregunta_texto'), '') = '' THEN
            CONTINUE;
        END IF;

        INSERT INTO public.config_preguntas_1a1
            (orden, pregunta_texto, opciones, plano_label, activa, updated_at)
        VALUES (
            (v_p->>'orden')::INT,
            v_p->>'pregunta_texto',
            ARRAY(SELECT jsonb_array_elements_text(v_p->'opciones')),
            NULLIF(v_p->>'plano_label', ''),
            COALESCE((v_p->>'activa')::BOOLEAN, TRUE),
            NOW()
        )
        ON CONFLICT (orden) DO UPDATE SET
            pregunta_texto = EXCLUDED.pregunta_texto,
            opciones       = EXCLUDED.opciones,
            plano_label    = EXCLUDED.plano_label,
            activa         = EXCLUDED.activa,
            updated_at     = NOW();

        v_keep := array_append(v_keep, (v_p->>'orden')::INT);
    END LOOP;

    -- Desactivar las preguntas cuyos órdenes quedaron fuera del payload
    UPDATE public.config_preguntas_1a1
    SET activa = FALSE, updated_at = NOW()
    WHERE NOT (orden = ANY(v_keep)) AND activa = TRUE;

    RETURN json_build_object(
        'success', TRUE,
        'preguntas', (SELECT public.get_preguntas_1a1_activas())
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_preguntas_1to1_admin(TEXT, JSONB) TO anon, authenticated;

COMMIT;
