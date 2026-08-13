-- =============================================================================
-- Red Solar Viva · 20260729_espejo_contexto_vivo.sql
-- EL ESPEJO CON CONTEXTO VIVO — Fase 1 (todo servidor, cero build)
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → pegar → Run.
-- Pareja: edge `oraculo-chat` v1.13 (la llama con service_role y teje el bloque).
--
-- QUÉ CREA:
--   1) `espejo_context_prefs` — los interruptores del Tripulante (la UI llega en
--      Fase 2 con el build; mientras, los defaults gobiernan: campo SÍ, sueños NO).
--   2) `get_espejo_context(p_clerk_user_id)` — LA FICHA: un jsonb compacto con el
--      estado real del Tripulante, leído al vuelo de sus propias superficies:
--      · pilares (último valor + ciclo previo + hace cuántos días) + Índice de Luz
--      · rachas (título descifrado, días vivos, récord, pausa, reinicio reciente)
--      · Sendero (días activos en 30, Fotones Maestría, Fotones de hoy)
--      · Plan de Vuelo (misiones de HOY + pendientes de la semana)
--      · Realidad Elegida (su visión anclada, 1 línea por ángulo, SOLO si selló)
--      · sueños recientes (SOLO si su interruptor dreams_enabled está encendido)
--      · medallas + perfil (nombre de pila, plan, meses en el Escáner)
--   3) `set_espejo_context_prefs` — el setter (lo cablea la Fase 2 vía user-action).
--
-- PRIVACIDAD (los 5 principios de la sala 2026-07-29):
--   · SE RESUME, NO SE VUELCA: números y etiquetas; los textos íntimos viajan
--     truncados a una línea (visión 180 chars, dictamen de sueño 220).
--   · EFÍMERO: la ficha se arma por request y NO se persiste en ningún lado
--     (ni en oraculo_messages ni en logs). El descifrado ocurre aquí adentro
--     (SECURITY DEFINER) con los helpers ya existentes (_priv_decrypt /
--     _vision_decrypt); nada se re-escribe en claro.
--   · LO INSTRUMENTAL POR DEFECTO, LO EMERGENTE SE CONSIENTE: sueños solo con
--     dreams_enabled=true. La Bitácora NO entra (decisión de Zak, fuera por ahora).
--   · NUNCA: DMs, correo, identidad completa, datos de terceros.
--   · JOYA DE LA CORONA: esta función concentra todo → REVOKE total; SOLO
--     service_role (el edge) puede ejecutarla. Entra a audit_verify.py hoy mismo.
--
-- DEFENSIVO: cada sección vive en su propio BEGIN/EXCEPTION → si una superficie
-- falla o cambia, la ficha sale sin esa sección, jamás revienta el Espejo.
-- ROLLBACK DEL FEATURE: flag `espejo_contexto_off` en app_flags (interruptor en
-- Motor → ⌂ Inicio → Pruebas A/B, o SQL: INSERT INTO app_flags VALUES
-- ('espejo_contexto_off', true) ON CONFLICT (key) DO UPDATE SET value = true).
-- Con el flag encendido el edge ni siquiera llama esta función → Espejo idéntico
-- al de hoy. Esta migración es 100% aditiva: no toca ninguna tabla/RPC existente.
-- =============================================================================

-- ── 1) Interruptores de contexto ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.espejo_context_prefs (
    clerk_user_id  text PRIMARY KEY,
    master_enabled boolean NOT NULL DEFAULT true,   -- apaga TODA la ficha
    dreams_enabled boolean NOT NULL DEFAULT false,  -- sueños: consentimiento aparte
    updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.espejo_context_prefs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.espejo_context_prefs FROM PUBLIC, anon, authenticated;
GRANT  ALL ON TABLE public.espejo_context_prefs TO service_role;

-- ── 2) LA FICHA ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_espejo_context(p_clerk_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_master   boolean;
    v_dreams   boolean;
    v_out      jsonb := '{}'::jsonb;
    v_today    date  := (now() AT TIME ZONE 'America/Cancun')::date;

    -- perfil
    v_nombre       text;
    v_email        text;
    v_cuenta_desde timestamptz;
    v_plan         text;
    v_member       boolean := false;

    -- pilares (claves internas ↔ columnas reales de scan_vibracional)
    v_keys     text[] := ARRAY['fisico','mental','emocional','financiero','vector','orbita'];
    v_cols     text[] := ARRAY['hardware_fisico','procesador_mental','motor_emocional',
                               'gravedad_financiera','vector_expansion','orbita_relacional'];
    v_pilares  jsonb := '[]'::jsonb;
    v_val      int;
    v_prev     int;
    v_ts       timestamptz;
    v_sum      numeric := 0;
    v_cnt      int := 0;
    v_last_scan timestamptz;

    v_rachas     jsonb;
    v_dias30     int;
    v_fot_total  bigint;
    v_fot_hoy    bigint;
    v_hoy_tareas jsonb;
    v_week_pend  int;
    v_sellada    timestamptz;
    v_vision     jsonb;
    v_suenos     jsonb;
    v_med_n      int;
    v_med_last   text;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN jsonb_build_object('enabled', false);
    END IF;

    -- Interruptores (sin fila = defaults: campo sí, sueños no).
    BEGIN
        SELECT master_enabled, dreams_enabled INTO v_master, v_dreams
        FROM espejo_context_prefs WHERE clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    v_master := COALESCE(v_master, true);
    v_dreams := COALESCE(v_dreams, false);
    IF NOT v_master THEN
        RETURN jsonb_build_object('enabled', false);
    END IF;

    -- ── PERFIL ────────────────────────────────────────────────────────────
    BEGIN
        SELECT full_name, email INTO v_nombre, v_email
        FROM profiles WHERE clerk_user_id = p_clerk_user_id LIMIT 1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        SELECT created_at INTO v_cuenta_desde
        FROM profiles WHERE clerk_user_id = p_clerk_user_id LIMIT 1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        IF COALESCE(v_email, '') <> '' THEN
            -- Denylist canónica del Espejo: cualquier sub activa que no sea un
            -- tier de decodificador (199/399) = membresía plena.
            SELECT bool_or(lower(COALESCE(s.group_name, '')) NOT IN ('decoder', 'dream'))
              INTO v_member
              FROM subscriptions s
             WHERE lower(s.email) = lower(trim(v_email)) AND s.status = 'active';
            v_member := COALESCE(v_member, false);
            IF v_member THEN
                SELECT CASE
                         WHEN bool_or(lower(COALESCE(s.group_name, '')) IN ('cuasar','pulsar','inmersion'))
                              THEN 'Inmersión Solar'
                         ELSE 'Sintonía Solar'
                       END
                  INTO v_plan
                  FROM subscriptions s
                 WHERE lower(s.email) = lower(trim(v_email)) AND s.status = 'active'
                   AND lower(COALESCE(s.group_name, '')) NOT IN ('decoder', 'dream');
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN v_member := false; END;

    -- ── PILARES ───────────────────────────────────────────────────────────
    -- Por pilar: el último valor medido + hace cuántos días + el valor de un
    -- ciclo anterior (≥3 días más viejo = otro ciclo; los escaneos son semanales).
    BEGIN
        FOR i IN 1..6 LOOP
            v_val := NULL; v_prev := NULL; v_ts := NULL;
            EXECUTE format(
                'SELECT %1$I::int, created_at FROM public.scan_vibracional
                  WHERE clerk_user_id = $1 AND %1$I IS NOT NULL
                  ORDER BY created_at DESC LIMIT 1', v_cols[i])
            INTO v_val, v_ts USING p_clerk_user_id;
            IF v_val IS NOT NULL THEN
                EXECUTE format(
                    'SELECT %1$I::int FROM public.scan_vibracional
                      WHERE clerk_user_id = $1 AND %1$I IS NOT NULL
                        AND created_at < $2 - interval ''3 days''
                      ORDER BY created_at DESC LIMIT 1', v_cols[i])
                INTO v_prev USING p_clerk_user_id, v_ts;
                v_pilares := v_pilares || jsonb_build_object(
                    'key',  v_keys[i],
                    'val',  v_val,
                    'dias', GREATEST(0, floor(extract(epoch FROM (now() - v_ts)) / 86400))::int,
                    'prev', v_prev
                );
                v_sum := v_sum + v_val;
                v_cnt := v_cnt + 1;
            END IF;
        END LOOP;
        SELECT max(created_at) INTO v_last_scan
        FROM scan_vibracional WHERE clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- ── RACHAS (título descifrado aquí adentro; jamás sale re-escrito) ─────
    BEGIN
        SELECT jsonb_agg(jsonb_build_object(
                   'titulo',   left(COALESCE(public._priv_decrypt(r.title, r.enc), ''), 60),
                   'dias',     CASE WHEN r.paused_at IS NULL
                                    THEN GREATEST(0, floor(extract(epoch FROM (now() - r.started_at)) / 86400))::int
                                    ELSE NULL END,
                   'en_pausa', r.paused_at IS NOT NULL,
                   'record_dias', GREATEST(0, floor(COALESCE(r.best_seconds, 0) / 86400.0))::int,
                   'reinicio_dias', CASE
                       WHEN jsonb_typeof(r.history) = 'array'
                            AND jsonb_array_length(r.history) > 0
                            AND (r.history -> -1 ->> 'e') IS NOT NULL
                       THEN GREATEST(0, floor(extract(epoch FROM (now() - ((r.history -> -1 ->> 'e')::timestamptz))) / 86400))::int
                       ELSE NULL END
               ) ORDER BY r.created_at ASC)
          INTO v_rachas
          FROM (SELECT * FROM rachas
                 WHERE clerk_user_id = p_clerk_user_id
                 ORDER BY created_at ASC LIMIT 6) r;
    EXCEPTION WHEN OTHERS THEN v_rachas := NULL; END;

    -- ── SENDERO DE LUZ ────────────────────────────────────────────────────
    BEGIN
        SELECT count(DISTINCT checkin_date) FILTER (WHERE checkin_date >= v_today - 29),
               COALESCE(sum(points) FILTER (WHERE checkin_date < v_today), 0),
               COALESCE(sum(points) FILTER (WHERE checkin_date = v_today), 0)
          INTO v_dias30, v_fot_total, v_fot_hoy
          FROM daily_checkins
         WHERE clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- ── PLAN DE VUELO (hoy en hora de México + pendientes de la semana) ────
    BEGIN
        SELECT jsonb_agg(jsonb_build_object(
                   't',       left(t.title, 80),
                   'sellada', t.done_at IS NOT NULL,
                   'pilar',   NULLIF(t.pilar, '')
               ) ORDER BY t.sort_order ASC)
          INTO v_hoy_tareas
          FROM (SELECT title, done_at, pilar, sort_order
                  FROM day_tasks
                 WHERE clerk_user_id = p_clerk_user_id AND task_date = v_today
                 ORDER BY sort_order ASC LIMIT 8) t;
        SELECT count(*)::int INTO v_week_pend
          FROM day_tasks
         WHERE clerk_user_id = p_clerk_user_id
           AND task_date > v_today AND task_date <= v_today + 6
           AND done_at IS NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- ── REALIDAD ELEGIDA (solo si la ceremonia quedó sellada) ──────────────
    BEGIN
        SELECT sellada_at INTO v_sellada
          FROM vision_board WHERE clerk_user_id = p_clerk_user_id;
        IF v_sellada IS NOT NULL THEN
            SELECT jsonb_agg(jsonb_build_object('pilar', a.k, 'vision', a.v)
                             ORDER BY a.sort_order ASC)
              INTO v_vision
              FROM (SELECT CASE WHEN va.angle_key IN ('fisico','mental','emocional',
                                                      'financiero','vector','orbita')
                                THEN va.angle_key
                                ELSE COALESCE(NULLIF(va.pilar, ''), 'propio') END AS k,
                           left(regexp_replace(COALESCE(public._vision_decrypt(va.body, va.enc), ''),
                                               '\s+', ' ', 'g'), 180) AS v,
                           va.sort_order
                      FROM vision_answers va
                     WHERE va.clerk_user_id = p_clerk_user_id
                       AND COALESCE(va.body, '') <> ''
                     ORDER BY va.sort_order ASC
                     LIMIT 8) a
             WHERE COALESCE(a.v, '') <> '';
        END IF;
    EXCEPTION WHEN OTHERS THEN v_vision := NULL; END;

    -- ── SUEÑOS (SOLO con el interruptor encendido; esencia, no el sueño) ───
    IF v_dreams THEN
        BEGIN
            SELECT jsonb_agg(jsonb_build_object(
                       'dias',    GREATEST(0, floor(extract(epoch FROM (now() - d.created_at)) / 86400))::int,
                       'titulo',  left(COALESCE(d.ct, ''), 60),
                       'banda',   COALESCE(d.banda_frecuencial, ''),
                       'lucido',  COALESCE(d.is_lucid, false),
                       'esencia', left(regexp_replace(COALESCE(d.dict, ''), '\s+', ' ', 'g'), 220)
                   ) ORDER BY d.created_at DESC)
              INTO v_suenos
              FROM (SELECT created_at, banda_frecuencial, is_lucid,
                           public._priv_decrypt(dictamen_vibral, enc) AS dict,
                           public._priv_decrypt(custom_title, enc)    AS ct
                      FROM dream_records
                     WHERE clerk_user_id = p_clerk_user_id
                       AND dictamen_vibral IS NOT NULL
                       AND (status IS NULL OR status::text = 'done')
                     ORDER BY created_at DESC
                     LIMIT 4) d;
        EXCEPTION WHEN OTHERS THEN v_suenos := NULL; END;
    END IF;

    -- ── MEDALLAS ──────────────────────────────────────────────────────────
    BEGIN
        SELECT count(*)::int INTO v_med_n
          FROM medal_unlocks WHERE clerk_user_id = p_clerk_user_id;
        IF COALESCE(v_med_n, 0) > 0 THEN
            SELECT c.label || ' · nivel ' || u.tier_index
              INTO v_med_last
              FROM medal_unlocks u
              JOIN medal_constelaciones c ON c.constelacion_key = u.constelacion_key
             WHERE u.clerk_user_id = p_clerk_user_id
             ORDER BY u.unlocked_at DESC LIMIT 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- ── ENSAMBLE ──────────────────────────────────────────────────────────
    v_out := jsonb_build_object('enabled', true, 'dreams_enabled', v_dreams);

    v_out := v_out || jsonb_build_object('perfil', jsonb_strip_nulls(jsonb_build_object(
        'nombre',  NULLIF(split_part(trim(COALESCE(v_nombre, '')), ' ', 1), ''),
        'miembro', v_member,
        'plan',    v_plan,
        'meses_en_el_escaner', CASE WHEN v_cuenta_desde IS NOT NULL
            THEN GREATEST(0, floor(extract(epoch FROM (now() - v_cuenta_desde)) / 2592000))::int
            ELSE NULL END
    )));

    IF v_cnt > 0 THEN
        v_out := v_out || jsonb_build_object(
            'pilares', v_pilares,
            'indice_luz', round(v_sum / v_cnt)::int,
            'ultimo_escaneo_dias', CASE WHEN v_last_scan IS NOT NULL
                THEN GREATEST(0, floor(extract(epoch FROM (now() - v_last_scan)) / 86400))::int
                ELSE NULL END
        );
    END IF;
    IF v_rachas IS NOT NULL THEN
        v_out := v_out || jsonb_build_object('rachas', v_rachas);
    END IF;
    IF COALESCE(v_dias30, 0) > 0 OR COALESCE(v_fot_total, 0) > 0 THEN
        v_out := v_out || jsonb_build_object('sendero', jsonb_build_object(
            'dias_activos_30',  COALESCE(v_dias30, 0),
            'fotones_maestria', COALESCE(v_fot_total, 0),
            'fotones_hoy',      COALESCE(v_fot_hoy, 0)
        ));
    END IF;
    IF v_hoy_tareas IS NOT NULL OR COALESCE(v_week_pend, 0) > 0 THEN
        v_out := v_out || jsonb_build_object('plan_vuelo', jsonb_build_object(
            'hoy',               COALESCE(v_hoy_tareas, '[]'::jsonb),
            'semana_pendientes', COALESCE(v_week_pend, 0)
        ));
    END IF;
    IF v_vision IS NOT NULL THEN
        v_out := v_out || jsonb_build_object('realidad_elegida', v_vision);
    END IF;
    IF v_suenos IS NOT NULL THEN
        v_out := v_out || jsonb_build_object('suenos', v_suenos);
    END IF;
    IF COALESCE(v_med_n, 0) > 0 THEN
        v_out := v_out || jsonb_build_object('medallas',
            jsonb_strip_nulls(jsonb_build_object('n', v_med_n, 'ultima', v_med_last)));
    END IF;

    RETURN v_out;
END $$;

-- ── 3) Setter de interruptores (lo cablea la Fase 2 vía user-action) ─────────
CREATE OR REPLACE FUNCTION public.set_espejo_context_prefs(
    p_clerk_user_id text,
    p_master boolean DEFAULT NULL,
    p_dreams boolean DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    INSERT INTO public.espejo_context_prefs (clerk_user_id, master_enabled, dreams_enabled, updated_at)
    VALUES (p_clerk_user_id, COALESCE(p_master, true), COALESCE(p_dreams, false), now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        master_enabled = COALESCE(p_master, espejo_context_prefs.master_enabled),
        dreams_enabled = COALESCE(p_dreams, espejo_context_prefs.dreams_enabled),
        updated_at     = now();
    RETURN json_build_object('success', true);
END $$;

-- ── GRANTS — joya de la corona: SOLO el servidor (edge) puede tocarlas ───────
-- 🜂 Regla del proyecto: un CREATE OR REPLACE futuro re-otorga a PUBLIC lo que
-- un REVOKE cerró → si alguna vez se re-crea get_espejo_context, RE-AFIRMAR
-- estos REVOKE al final de ESA migración. audit_verify.py la vigila desde hoy.
REVOKE ALL ON FUNCTION public.get_espejo_context(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_espejo_context(text) TO service_role;
REVOKE ALL ON FUNCTION public.set_espejo_context_prefs(text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_espejo_context_prefs(text, boolean, boolean) TO service_role;
