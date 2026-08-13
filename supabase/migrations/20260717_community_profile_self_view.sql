-- Red Solar Viva · COMUNIDAD · Ver MI PROPIA tarjeta ("Ver mi tarjeta de identidad")
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
--
-- Mi Firma de Luz estrena, en "Presencia en la Red", un boton que abre TU
-- tarjeta tal como la ve alguien mas en Comunidad -> Explorar. Reusa la misma
-- tarjeta y la misma RPC (get_community_profile) -> lo que ves es literalmente
-- lo que ellos ven, no una maqueta que se pueda desincronizar.
--
-- Antes esto era imposible: el WHERE exigia `cp.visible OR (existe una
-- conversacion con el viewer)`. Mirandote a ti mismo, con la visibilidad
-- APAGADA, no hay conversacion contigo -> devolvia 'not_found' y la tarjeta
-- salia vacia. Justo al reves de lo util: el momento en que mas quieres verte
-- es ANTES de mostrarte.
--
-- Cambia SOLO dos cosas sobre el cuerpo VIGENTE (20260622d, generado desde el
-- archivo para no transcribir 90 lineas a mano):
--   1. `OR tgt = p_clerk_user_id` en el WHERE de visibilidad.
--   2. Los guards de bloqueo/baneo se saltan cuando el target eres tu mismo.
-- Todo lo demas (scan, edad, medallas, foto opt-in, intereses, catalogo) queda
-- intacto. Misma firma (text, text) -> CREATE OR REPLACE, sin DROP.
--
-- Nota de seguridad: sigue siendo el GATEWAY (user-action) quien inyecta el
-- p_clerk_user_id VERIFICADO del token, asi que "yo mismo" no es forjable.

CREATE OR REPLACE FUNCTION public.get_community_profile(
    p_clerk_user_id text,
    p_target_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d_today date := (now() AT TIME ZONE 'America/Cancun')::date;
    tgt text := COALESCE(p_target_clerk_id, '');
    v_alias text; v_bio text; v_avatar text; v_equipped jsonb; v_mastery int;
    v_bd date; v_pref text;
    v_show boolean; v_photo text;
    v_scan json;
    v_streak int := 0; v_dias int := 0; v_rituales int := 0; v_etapa int := 1;
    v_th jsonb;
    v_medals json;
    result json;
BEGIN
    -- Mirarte a ti mismo nunca pasa por los guards de bloqueo/baneo.
    IF tgt <> p_clerk_user_id
       AND (public._community_blocked(p_clerk_user_id, tgt) OR public._community_banned(tgt)) THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT
        cp.alias, cp.bio, cp.birthdate, cp.relationship_pref,
        cp.show_photo, cp.photo_url,
        COALESCE(s.selected_avatar, 'nova'),
        COALESCE(s.equipped, '{}'::jsonb),
        COALESCE((
            SELECT SUM(dc.points) FROM daily_checkins dc
            WHERE dc.clerk_user_id = cp.clerk_user_id AND dc.checkin_date < d_today
        ), 0)::int
    INTO v_alias, v_bio, v_bd, v_pref, v_show, v_photo, v_avatar, v_equipped, v_mastery
    FROM community_profiles cp
    LEFT JOIN user_crystal_state s ON s.clerk_user_id = cp.clerk_user_id
    WHERE cp.clerk_user_id = tgt
      AND COALESCE(NULLIF(TRIM(cp.alias), ''), '') <> ''
      AND (
        cp.visible
        -- ESPEJO (nuevo): siempre puedes ver TU PROPIA tarjeta, estes visible o
        -- no. Es tu reflejo -- justamente sirve mas cuando aun no te muestras,
        -- para decidir con que cara entrarias a la Constelacion.
        OR tgt = p_clerk_user_id
        -- Modelo 1 (reveal por contacto): un Tripulante OCULTO se revela SOLO
        -- a quien ya tiene una conversacion con el. Si existe un hilo entre el
        -- viewer (p_clerk_user_id) y el target (tgt), el viewer puede ver su
        -- tarjeta aunque el target este oculto. El directorio publico sigue
        -- mostrando solo a los visibles; esto solo abre el card en el chat.
        OR EXISTS (
            SELECT 1 FROM public.dm_conversations dc
            WHERE (dc.user_a = p_clerk_user_id AND dc.user_b = tgt)
               OR (dc.user_a = tgt AND dc.user_b = p_clerk_user_id)
        )
      );

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'not_found');
    END IF;

    SELECT json_build_object(
        'indice', sv.indice_silicio, 'fisico', sv.hardware_fisico,
        'mental', sv.procesador_mental, 'emocional', sv.motor_emocional,
        'financiero', sv.gravedad_financiera, 'vector', sv.vector_expansion,
        'orbita', sv.orbita_relacional, 'scanned_at', sv.created_at
    ) INTO v_scan
    FROM scan_vibracional sv
    WHERE sv.clerk_user_id = tgt
      AND sv.cycle_scanned_json LIKE '%"fisico"%'
      AND sv.cycle_scanned_json LIKE '%"mental"%'
      AND sv.cycle_scanned_json LIKE '%"emocional"%'
      AND sv.cycle_scanned_json LIKE '%"financiero"%'
      AND sv.cycle_scanned_json LIKE '%"vector"%'
      AND sv.cycle_scanned_json LIKE '%"orbita"%'
    ORDER BY sv.created_at DESC
    LIMIT 1;

    BEGIN
        SELECT COUNT(DISTINCT checkin_date)::int INTO v_dias
        FROM daily_checkins WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01';

        SELECT COUNT(*)::int INTO v_rituales
        FROM daily_checkins WHERE clerk_user_id = tgt AND activity_key <> 'admin_adjust';

        WITH d AS (
            SELECT DISTINCT checkin_date AS cd FROM daily_checkins
            WHERE clerk_user_id = tgt AND checkin_date <> DATE '2000-01-01' AND checkin_date <= d_today
        ),
        g AS (SELECT cd, (cd - (ROW_NUMBER() OVER (ORDER BY cd))::int) AS grp FROM d)
        SELECT CASE
            WHEN (SELECT MAX(cd) FROM d) IS NULL OR (SELECT MAX(cd) FROM d) < d_today - 1 THEN 0
            ELSE (SELECT COUNT(*) FROM g WHERE grp = (SELECT grp FROM g ORDER BY cd DESC LIMIT 1))::int
        END INTO v_streak;
        v_streak := COALESCE(v_streak, 0);

        SELECT thresholds INTO v_th FROM avatar_config WHERE avatar_key = v_avatar;
        v_th := COALESCE(v_th, '[0,50,250,800,2000,5000,12000]'::jsonb);
        SELECT GREATEST(COUNT(*), 1)::int INTO v_etapa
        FROM jsonb_array_elements_text(v_th) t WHERE v_mastery >= (t::numeric);
    EXCEPTION WHEN OTHERS THEN
        v_streak := 0; v_dias := 0; v_rituales := 0; v_etapa := 1;
    END;

    SELECT COALESCE(json_agg(json_build_object(
        'key', mc.constelacion_key, 'label', mc.label, 'glyph', mc.glyph_key,
        'accent', mc.accent,
        'total', (SELECT COUNT(*) FROM medal_tiers mt WHERE mt.constelacion_key = mc.constelacion_key),
        'unlocked', (
            SELECT COUNT(*) FROM medal_tiers mt
            WHERE mt.constelacion_key = mc.constelacion_key
              AND (CASE mc.metric
                    WHEN 'fotones'      THEN v_mastery
                    WHEN 'racha'        THEN v_streak
                    WHEN 'dias_activos' THEN v_dias
                    WHEN 'rituales'     THEN v_rituales
                    WHEN 'etapa'        THEN v_etapa
                    ELSE 0 END) >= mt.threshold
        )
    ) ORDER BY mc.sort_order, mc.label), '[]'::json)
    INTO v_medals
    FROM medal_constelaciones mc WHERE mc.active;

    SELECT json_build_object(
        'clerk_user_id', tgt, 'alias', v_alias, 'bio', v_bio,
        'avatar_key', v_avatar, 'equipped', v_equipped, 'mastery', v_mastery,
        'relationship_pref', v_pref,
        'photo', CASE WHEN COALESCE(v_show, false) AND v_photo IS NOT NULL THEN v_photo ELSE NULL END,
        'age', CASE WHEN v_bd IS NULL THEN NULL ELSE date_part('year', age(v_bd))::int END,
        'scan', v_scan,
        'medals', v_medals,
        'interests', COALESCE((
            SELECT json_agg(json_build_object('key', ci.interest_key, 'label', ci.label)
                            ORDER BY ci.sort_order, ci.label)
            FROM community_profile_interests pi
            JOIN community_interests ci ON ci.interest_key = pi.interest_key
            WHERE pi.clerk_user_id = tgt
        ), '[]'::json),
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'item_key', item_key, 'kind', kind, 'label', label, 'params', params
            ) ORDER BY kind, sort_order, label)
            FROM crystal_catalog WHERE active
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

NOTIFY pgrst, 'reload schema';
