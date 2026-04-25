-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Observatorio de Resonancia · Infraestructura (2026-04-24)
--
-- Consolida todo el backend del componente maestro <ObservatorioResonancia />.
-- Idempotente: corre este archivo en Dashboard → SQL Editor → Run las veces
-- necesarias. No duplica seeds, no reescribe datos.
--
--   1. Tabla telemetria_camara      (transcripciones Cámara Solar grupal)
--   2. Tabla config_preguntas_1a1   (preguntas dinámicas del Escaneo Relámpago)
--   3. Columnas nuevas en reservas  (escaneo_resultado, intencion_texto)
--   4. Seed de 3 preguntas por defecto
--   5. RPCs SECURITY DEFINER:
--        · get_preguntas_1a1_activas()             (cualquier user)
--        · upsert_escaneo_relampago(...)           (cualquier user, valida owner)
--        · get_citas_1to1_de_tripulante(p_clerk)   (cualquier user)
--        · get_observatorio_1to1_admin(p_clerk)    (gate admin)
--        · get_observatorio_camara_admin(p_clerk)  (gate admin)
--        · upsert_preguntas_1to1_admin(p_clerk,..) (gate admin)
--        · insert_telemetria_camara(...)           (service_role only)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. TELEMETRIA_CAMARA — transcripciones de sesiones grupales
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telemetria_camara (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sesion        TEXT NOT NULL UNIQUE,     -- slug estable: YYYY-MM-DD[_tag]
    fecha            DATE NOT NULL,
    transcript_json  JSONB NOT NULL,           -- [{speaker,start,end,text}]
    pdf_url          TEXT,
    sello_text       TEXT,                     -- texto destilado por Gemini
    speakers_summary JSONB,                    -- {"speaker_0":{words:N,turns:M},...}
    duracion_minutos INT,
    total_palabras   INT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetria_camara_fecha ON public.telemetria_camara (fecha DESC);
ALTER TABLE public.telemetria_camara ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service_role (pipeline Python) y RPCs SECURITY DEFINER leen/escriben.

-- ────────────────────────────────────────────────────────────────
-- 2. CONFIG_PREGUNTAS_1A1 — preguntas dinámicas del Escaneo Relámpago
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.config_preguntas_1a1 (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden          INT NOT NULL UNIQUE,
    pregunta_texto TEXT NOT NULL,
    opciones       TEXT[] NOT NULL,
    plano_label    TEXT,
    activa         BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.config_preguntas_1a1 ENABLE ROW LEVEL SECURITY;

-- Seed idempotente (solo inserta si no existe pregunta con ese orden)
INSERT INTO public.config_preguntas_1a1 (orden, pregunta_texto, opciones, plano_label, activa)
SELECT 1, '¿Cómo sientes tu conductividad hoy?',
       ARRAY['Bloqueada / Pesada','Fluctuante / Bipolar','Superconductiva / Limpia'],
       'Plano Físico · Hardware', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.config_preguntas_1a1 WHERE orden=1);

INSERT INTO public.config_preguntas_1a1 (orden, pregunta_texto, opciones, plano_label, activa)
SELECT 2, '¿Cuál es el glitch principal en tu arquitectura?',
       ARRAY['Estructura / Lógica','Energía / Flujo','Visión / Dirección'],
       'Plano de Proyecto · Software', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.config_preguntas_1a1 WHERE orden=2);

INSERT INTO public.config_preguntas_1a1 (orden, pregunta_texto, opciones, plano_label, activa)
SELECT 3, '¿Qué nivel de ignición buscas hoy?',
       ARRAY['Diagnóstico Sutil','Intervención Quirúrgica','Reconfiguración Total'],
       'Plano de Intención', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.config_preguntas_1a1 WHERE orden=3);

-- ────────────────────────────────────────────────────────────────
-- 3. RESERVAS — columnas para el Escaneo Relámpago 1:1
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.reservas
    ADD COLUMN IF NOT EXISTS escaneo_resultado     JSONB,
    ADD COLUMN IF NOT EXISTS intencion_texto       TEXT,
    ADD COLUMN IF NOT EXISTS escaneo_completado_at TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────────
-- 4. RPC · get_preguntas_1a1_activas
--    Cualquier tripulante con cita puede leerlas.
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
            SELECT id, orden, pregunta_texto, opciones, plano_label
            FROM public.config_preguntas_1a1
            WHERE activa = TRUE
            ORDER BY orden
        ) q
    ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_preguntas_1a1_activas() TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 5. RPC · upsert_escaneo_relampago
--    Escribe el escaneo del tripulante sobre su propia reserva.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_escaneo_relampago(
    p_clerk_user_id TEXT,
    p_reserva_id    UUID,
    p_escaneo       JSONB,
    p_intencion     TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows INT;
BEGIN
    IF p_clerk_user_id IS NULL OR p_reserva_id IS NULL THEN
        RETURN json_build_object('error','missing_params');
    END IF;

    UPDATE public.reservas
    SET escaneo_resultado     = p_escaneo,
        intencion_texto       = NULLIF(TRIM(p_intencion), ''),
        escaneo_completado_at = NOW(),
        updated_at            = NOW()
    WHERE id = p_reserva_id
      AND clerk_user_id = p_clerk_user_id
      AND status = 'confirmada';

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RETURN json_build_object('error','no_match','detail','reserva no encontrada o no pertenece al tripulante');
    END IF;
    RETURN json_build_object('success', TRUE, 'reserva_id', p_reserva_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_escaneo_relampago(TEXT, UUID, JSONB, TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 6. RPC · get_citas_1to1_de_tripulante
--    Devuelve las citas 1:1 confirmadas del tripulante (con Zoom + escaneo).
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_citas_1to1_de_tripulante(
    p_clerk_user_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_clerk_user_id IS NULL THEN
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
            WHERE r.clerk_user_id = p_clerk_user_id
              AND r.status = 'confirmada'
              AND a.slot_type LIKE 'individual_%'
              AND a.start_time >= NOW() - INTERVAL '2 hours'
            ORDER BY a.start_time ASC
        ) c
    ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_citas_1to1_de_tripulante(TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 7. RPC · get_observatorio_1to1_admin
--    Panel admin: próximas 1:1 + preguntas activas.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_observatorio_1to1_admin(
    p_clerk_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN json_build_object(
        'citas', COALESCE((
            SELECT json_agg(row_to_json(c) ORDER BY c.start_time)
            FROM (
                SELECT
                    r.id                 AS reserva_id,
                    r.name,
                    r.email,
                    r.clerk_user_id,
                    r.status,
                    r.confirmed_at,
                    r.amount_mxn_cents,
                    r.zoom_join_url,
                    r.zoom_meeting_id,
                    r.zoom_used_fallback,
                    r.escaneo_resultado,
                    r.intencion_texto,
                    r.escaneo_completado_at,
                    a.slot_type,
                    a.start_time,
                    a.end_time
                FROM public.reservas r
                INNER JOIN public.asientos_reservados a ON a.id = r.asiento_id
                WHERE r.status = 'confirmada'
                  AND a.slot_type LIKE 'individual_%'
                  AND a.start_time >= NOW() - INTERVAL '6 hours'
                ORDER BY a.start_time ASC
                LIMIT 50
            ) c
        ), '[]'::json),
        'preguntas', (SELECT public.get_preguntas_1a1_activas())
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_observatorio_1to1_admin(TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 8. RPC · upsert_preguntas_1to1_admin
--    Edición del catálogo de preguntas desde el panel admin.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_preguntas_1to1_admin(
    p_clerk_id  TEXT,
    p_preguntas JSONB   -- [{orden, pregunta_texto, opciones, plano_label, activa}]
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_p        JSONB;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    IF jsonb_typeof(p_preguntas) <> 'array' THEN
        RETURN json_build_object('error','not_array');
    END IF;

    FOR v_p IN SELECT * FROM jsonb_array_elements(p_preguntas) LOOP
        INSERT INTO public.config_preguntas_1a1 (orden, pregunta_texto, opciones, plano_label, activa, updated_at)
        VALUES (
            (v_p->>'orden')::INT,
            v_p->>'pregunta_texto',
            ARRAY(SELECT jsonb_array_elements_text(v_p->'opciones')),
            v_p->>'plano_label',
            COALESCE((v_p->>'activa')::BOOLEAN, TRUE),
            NOW()
        )
        ON CONFLICT (orden) DO UPDATE SET
            pregunta_texto = EXCLUDED.pregunta_texto,
            opciones       = EXCLUDED.opciones,
            plano_label    = EXCLUDED.plano_label,
            activa         = EXCLUDED.activa,
            updated_at     = NOW();
    END LOOP;

    RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_preguntas_1to1_admin(TEXT, JSONB) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 9. RPC · get_observatorio_camara_admin
--    Transcripciones + sellos + análisis agregado grupal.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_observatorio_camara_admin(
    p_clerk_id TEXT,
    p_limit    INT DEFAULT 10
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error','not_admin');
    END IF;

    RETURN json_build_object(
        'sesiones', COALESCE((
            SELECT json_agg(row_to_json(t) ORDER BY t.fecha DESC)
            FROM (
                SELECT
                    id, id_sesion, fecha, pdf_url, sello_text,
                    speakers_summary, duracion_minutos, total_palabras,
                    transcript_json, created_at
                FROM public.telemetria_camara
                ORDER BY fecha DESC
                LIMIT COALESCE(p_limit, 10)
            ) t
        ), '[]'::json)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_observatorio_camara_admin(TEXT, INT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────
-- 10. RPC · insert_telemetria_camara
--     Upsert desde pipeline Python (service_role). Idempotente por id_sesion.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.insert_telemetria_camara(
    p_id_sesion        TEXT,
    p_fecha            DATE,
    p_transcript_json  JSONB,
    p_pdf_url          TEXT,
    p_sello_text       TEXT,
    p_speakers_summary JSONB,
    p_duracion_minutos INT DEFAULT NULL,
    p_total_palabras   INT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.telemetria_camara
        (id_sesion, fecha, transcript_json, pdf_url, sello_text,
         speakers_summary, duracion_minutos, total_palabras)
    VALUES
        (p_id_sesion, p_fecha, p_transcript_json, p_pdf_url, p_sello_text,
         p_speakers_summary, p_duracion_minutos, p_total_palabras)
    ON CONFLICT (id_sesion) DO UPDATE SET
        fecha            = EXCLUDED.fecha,
        transcript_json  = EXCLUDED.transcript_json,
        pdf_url          = COALESCE(EXCLUDED.pdf_url, public.telemetria_camara.pdf_url),
        sello_text       = COALESCE(EXCLUDED.sello_text, public.telemetria_camara.sello_text),
        speakers_summary = COALESCE(EXCLUDED.speakers_summary, public.telemetria_camara.speakers_summary),
        duracion_minutos = COALESCE(EXCLUDED.duracion_minutos, public.telemetria_camara.duracion_minutos),
        total_palabras   = COALESCE(EXCLUDED.total_palabras, public.telemetria_camara.total_palabras),
        updated_at       = NOW();
    RETURN json_build_object('success', TRUE, 'id_sesion', p_id_sesion);
END;
$$;
GRANT EXECUTE ON FUNCTION public.insert_telemetria_camara(TEXT, DATE, JSONB, TEXT, TEXT, JSONB, INT, INT) TO service_role;

COMMIT;
