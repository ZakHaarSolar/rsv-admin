-- ═══════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Observatorio · RPC para upload manual de transcripciones
--
-- Permite al Arquitecto pegar una transcripción + sello desde la UI del
-- Observatorio (sin correr el pipeline Python) — útil para anclar sesiones
-- pasadas o subir un sello destilado a mano.
--
-- Gemela funcional de `insert_telemetria_camara` pero con gate admin en vez
-- de service_role, así se puede llamar con el anon key del frontend.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.upsert_telemetria_camara_admin(
    p_clerk_id         TEXT,
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
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_clerk_id;
    IF NOT COALESCE(v_is_admin, FALSE) THEN
        RETURN json_build_object('error', 'not_admin');
    END IF;

    IF p_id_sesion IS NULL OR p_fecha IS NULL OR p_transcript_json IS NULL THEN
        RETURN json_build_object('error', 'missing_params');
    END IF;

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
GRANT EXECUTE ON FUNCTION public.upsert_telemetria_camara_admin(TEXT, TEXT, DATE, JSONB, TEXT, TEXT, JSONB, INT, INT) TO anon, authenticated;

COMMIT;
