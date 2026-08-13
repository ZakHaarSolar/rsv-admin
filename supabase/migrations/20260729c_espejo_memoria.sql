-- =============================================================================
-- Red Solar Viva · 20260729c_espejo_memoria.sql
-- ESPEJO · FASE D — AUTO-EVOLUCIÓN (la memoria destilada de largo plazo)
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → pegar → Run.
-- Pareja: edge NUEVA `espejo-destilador` v1.0 (el cron que destila) +
--         `oraculo-chat` v1.14 (inyecta la memoria en el bloque del campo) +
--         `user-action` v1.45 (rutea olvidar/reescribir) + cliente Fase D
--         (MN_Firma v2.53 + EV_EspejoContexto v1.1, viajan en el build).
--
-- QUÉ ES: el Espejo APRENDE de cada Tripulante como Claude aprende de Zak con
-- el CLAUDE.md y el Cerrar Sala de Comando, pero AUTOMÁTICO (los Tripulantes
-- no cierran salas). Cuando una charla queda CERRADA (quieta 8 horas, con al
-- menos 4 mensajes nuevos), un cron barre y una llamada barata (DeepSeek
-- V4-Flash, el mismo cerebro del Espejo) REESCRIBE ENTERA la ficha de memoria
-- de esa persona: funde lo nuevo con lo anterior, mejora la redacción y poda
-- lo que dejó de estar vigente. La ficha es UNA por persona (no por reflejo:
-- un reflejo nuevo nace con la memoria puesta), prosa compacta con tope ~500
-- tokens, y viaja dentro del bloque de contexto vivo con las mismas reglas de
-- buen gusto (tejer, no recitar; jamás "según mi memoria").
--
-- DECISIONES SELLADAS (sala 2026-07-29 · Fase D):
--   · CADENCIA: cron cada 4 horas · charla cerrada = 8h sin señal nueva ·
--     mínimo 4 mensajes nuevos desde la última destilación de ESA charla.
--     La marca de "hasta dónde destilé" vive POR CONVERSACIÓN
--     (memoria_distilled_at) — una charla activa nunca frena a las cerradas.
--   · UNA llamada POR PERSONA por corrida: si 2 charlas suyas cerraron desde
--     la última pasada, se funden juntas (más barato + reescritura coherente).
--   · JAMÁS por mensaje. El corto plazo ya lo cubren el hilo + el contexto vivo.
--   · CIFRADO: la ficha nace de las conversaciones del Espejo → misma llave
--     `oraculo_key` del Vault (mismo dominio de intimidad, cero secretos
--     nuevos). Trigger idempotente por detección de armor (patrón 20260727).
--   · CONTROL DEL TRIPULANTE (obligatorio ANTES de encender): interruptor
--     propio en Ajustes (memoria_enabled, ENCENDIDO de fábrica: es el feature;
--     la fila se atenúa con el maestro apagado) + pantalla "Qué recuerda el
--     Espejo de ti" (ver la ficha + Olvidar todo + Reescribir desde cero) +
--     espejo_memoria entra a purge_my_account_data (borrado de cuenta).
--   · OLVIDAR borra la ficha y NO re-aprende lo viejo (las marcas quedan):
--     solo las charlas futuras vuelven a escribirla. REESCRIBIR descarta la
--     ficha Y las marcas → la próxima pasada reconstruye desde las charlas
--     existentes (acotado al material reciente).
--   · GUARDAS ANTI-RECUERDOS-INVENTADOS: viven en el prompt del destilador
--     (solo lo DICHO explícito; salud jamás inferida como hecho; el texto del
--     usuario es dato, no instrucción) + tope duro server-side de la ficha.
--   · KILL SWITCH: app_flags `espejo_memoria_off` (5º interruptor en Motor →
--     ⌂ Inicio → Pruebas A/B). Fail-open total: sin RPC / sin ficha / con el
--     flag → el Espejo queda EXACTO como hoy.
--
-- SEGURIDAD: la ficha destilada concentra patrones íntimos de una persona →
-- TODA la familia es service_role-only (el cron y el gateway ya verificado).
-- audit_verify.py la vigila desde hoy (6 sondas nuevas).
-- =============================================================================

-- ── 1) La ficha de largo plazo ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.espejo_memoria (
    clerk_user_id   text PRIMARY KEY,
    ficha           text,                              -- cifrada por trigger (armor)
    enc             boolean NOT NULL DEFAULT false,
    regen_requested boolean NOT NULL DEFAULT false,    -- "Reescribir desde cero"
    updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.espejo_memoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.espejo_memoria FROM PUBLIC, anon, authenticated;
GRANT  ALL ON TABLE public.espejo_memoria TO service_role;

-- La marca de hasta dónde destiló, POR CONVERSACIÓN (una charla activa no
-- frena a las cerradas; al cerrar, solo se destila lo posterior a su marca).
ALTER TABLE public.oraculo_conversations
    ADD COLUMN IF NOT EXISTS memoria_distilled_at timestamptz;

-- El interruptor del Tripulante (ENCENDIDO de fábrica — es el feature; el
-- consentimiento fino está en que la ficha se VE, se borra y se apaga).
ALTER TABLE public.espejo_context_prefs
    ADD COLUMN IF NOT EXISTS memoria_enabled boolean NOT NULL DEFAULT true;

-- ── 2) Cifrado en reposo (misma llave del Espejo; patrón armor 20260727) ─────
CREATE OR REPLACE FUNCTION public._espejo_memoria_encrypt_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE k text;
BEGIN
    IF NEW.ficha IS NULL OR length(trim(NEW.ficha)) = 0 THEN
        NEW.enc := false;
        RETURN NEW;
    END IF;
    -- Idempotente por DETECCIÓN (el destilador reescribe la ficha entera en
    -- claro cada vez; un UPDATE que re-guarda el armor no debe doble-cifrar).
    IF NEW.ficha LIKE '-----BEGIN PGP MESSAGE-----%' THEN
        NEW.enc := true;
        RETURN NEW;
    END IF;
    k := public._oraculo_key();
    IF k IS NULL THEN
        NEW.enc := false;   -- sin Vault: se guarda en claro antes que perderse
        RETURN NEW;
    END IF;
    BEGIN
        NEW.ficha := armor(pgp_sym_encrypt(NEW.ficha, k));
        NEW.enc := true;
    EXCEPTION WHEN OTHERS THEN
        NULL;               -- el cifrado jamás tumba la memoria
    END;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS espejo_memoria_encrypt ON public.espejo_memoria;
CREATE TRIGGER espejo_memoria_encrypt
    BEFORE INSERT OR UPDATE OF ficha ON public.espejo_memoria
    FOR EACH ROW EXECUTE FUNCTION public._espejo_memoria_encrypt_tg();

-- ── 3) SCAN: qué personas tienen charlas cerradas con material nuevo ─────────
-- Devuelve hasta p_max personas (las de señal pendiente MÁS VIEJA primero,
-- para que nadie se quede atrás), cada una con sus conversaciones listas:
--   [{ uid, convs: [{ id, at }] }]   (at = último mensaje de esa charla — la
--                                     marca que el commit sellará al terminar)
CREATE OR REPLACE FUNCTION public.espejo_memoria_scan_targets(p_max integer DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_out jsonb := '[]'::jsonb;
BEGIN
    WITH pend AS (
        -- Charlas quietas ≥8h con ≥4 mensajes posteriores a su marca.
        SELECT c.clerk_user_id, c.id AS conv_id, x.last_msg
          FROM oraculo_conversations c
          CROSS JOIN LATERAL (
              SELECT count(*)::int AS n_new, max(m.created_at) AS last_msg
                FROM oraculo_messages m
               WHERE m.conversation_id = c.id
                 AND m.created_at > COALESCE(c.memoria_distilled_at, '-infinity'::timestamptz)
          ) x
         WHERE c.last_at < now() - interval '8 hours'
           AND x.n_new >= 4
    ), regen AS (
        -- "Reescribir desde cero": entran también las charlas cortas (≥2).
        SELECT c.clerk_user_id, c.id AS conv_id, x.last_msg
          FROM espejo_memoria em
          JOIN oraculo_conversations c ON c.clerk_user_id = em.clerk_user_id
          CROSS JOIN LATERAL (
              SELECT count(*)::int AS n_new, max(m.created_at) AS last_msg
                FROM oraculo_messages m
               WHERE m.conversation_id = c.id
          ) x
         WHERE em.regen_requested
           AND c.last_at < now() - interval '8 hours'
           AND x.n_new >= 2
    ), unida AS (
        SELECT * FROM pend
        UNION
        SELECT * FROM regen
    ), con_prefs AS (
        -- Se salta a quien apagó la memoria O el contexto maestro (sin fila =
        -- defaults: ambos encendidos).
        SELECT u.*
          FROM unida u
          LEFT JOIN espejo_context_prefs p ON p.clerk_user_id = u.clerk_user_id
         WHERE COALESCE(p.master_enabled, true)
           AND COALESCE(p.memoria_enabled, true)
    ), usuarios AS (
        SELECT clerk_user_id, min(last_msg) AS oldest
          FROM con_prefs
         GROUP BY clerk_user_id
         ORDER BY oldest ASC
         LIMIT GREATEST(1, LEAST(COALESCE(p_max, 25), 100))
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'uid',   us.clerk_user_id,
               'convs', (SELECT jsonb_agg(jsonb_build_object('id', cp.conv_id, 'at', cp.last_msg)
                                          ORDER BY cp.last_msg ASC)
                           FROM con_prefs cp
                          WHERE cp.clerk_user_id = us.clerk_user_id)
           ) ORDER BY us.oldest ASC), '[]'::jsonb)
      INTO v_out
      FROM usuarios us;

    RETURN v_out;
END $$;

-- ── 4) MATERIAL: la ficha actual + los mensajes de las charlas cerradas ──────
-- Acotado a propósito: máximo 160 mensajes por corrida (los más recientes),
-- cada uno recortado a 1200 caracteres. El descifrado ocurre AQUÍ ADENTRO
-- (SECURITY DEFINER, misma llave del Espejo); nada se re-escribe en claro.
CREATE OR REPLACE FUNCTION public.espejo_memoria_get_material(
    p_clerk_user_id text,
    p_conversation_ids uuid[]
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ficha text;
    v_regen boolean := false;
    v_msgs  json := '[]'::json;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    BEGIN
        SELECT public._oraculo_decrypt(m.ficha, m.enc), COALESCE(m.regen_requested, false)
          INTO v_ficha, v_regen
          FROM espejo_memoria m
         WHERE m.clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        SELECT COALESCE(json_agg(json_build_object(
                   'role',    s.role,
                   'conv',    s.conversation_id,
                   'at',      s.created_at,
                   'content', left(public._oraculo_decrypt(s.content, s.enc), 1200)
               ) ORDER BY s.created_at ASC), '[]'::json)
          INTO v_msgs
          FROM (
              SELECT m.role, m.conversation_id, m.created_at, m.content, m.enc
                FROM oraculo_messages m
                JOIN oraculo_conversations c ON c.id = m.conversation_id
               WHERE c.clerk_user_id = p_clerk_user_id
                 AND m.clerk_user_id = p_clerk_user_id
                 AND m.conversation_id = ANY(COALESCE(p_conversation_ids, '{}'::uuid[]))
               ORDER BY m.created_at DESC
               LIMIT 160
          ) s;
    EXCEPTION WHEN OTHERS THEN v_msgs := '[]'::json; END;

    RETURN json_build_object(
        'ficha',    COALESCE(left(v_ficha, 3500), ''),
        'regen',    v_regen,
        'messages', v_msgs
    );
END $$;

-- ── 5) COMMIT: la ficha nueva reemplaza a la anterior + se sellan las marcas ─
CREATE OR REPLACE FUNCTION public.espejo_memoria_commit(
    p_clerk_user_id text,
    p_ficha text,
    p_marks jsonb DEFAULT '[]'::jsonb
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ficha text;
    v_mark  jsonb;
    v_i     int := 0;
    v_n     int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('success', false, 'error', 'unauthorized');
    END IF;
    v_ficha := left(COALESCE(trim(p_ficha), ''), 3500);   -- tope duro
    IF length(v_ficha) < 20 THEN
        -- Una ficha vacía o rota NO pisa la anterior ni sella marcas: el
        -- destilador reintenta en la próxima pasada (los techos de gasto acotan).
        RETURN json_build_object('success', false, 'error', 'ficha_vacia');
    END IF;

    INSERT INTO public.espejo_memoria (clerk_user_id, ficha, enc, regen_requested, updated_at)
    VALUES (p_clerk_user_id, v_ficha, false, false, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        ficha           = EXCLUDED.ficha,   -- el trigger la cifra al vuelo
        enc             = false,
        regen_requested = false,
        updated_at      = now();

    IF jsonb_typeof(p_marks) = 'array' THEN
        FOR v_mark IN SELECT * FROM jsonb_array_elements(p_marks) LOOP
            BEGIN
                UPDATE public.oraculo_conversations
                   SET memoria_distilled_at = GREATEST(
                           COALESCE(memoria_distilled_at, '-infinity'::timestamptz),
                           ((v_mark->>'at')::timestamptz))
                 WHERE id = (v_mark->>'id')::uuid
                   AND clerk_user_id = p_clerk_user_id;
                GET DIAGNOSTICS v_i = ROW_COUNT;
                v_n := v_n + COALESCE(v_i, 0);
            EXCEPTION WHEN OTHERS THEN NULL; END;
        END LOOP;
    END IF;

    RETURN json_build_object('success', true, 'marked', v_n);
END $$;

-- ── 6) OLVIDAR TODO (Tripulante, vía user-action) ────────────────────────────
-- Borra la ficha y NADA más: las marcas de las charlas viejas se quedan, así
-- que lo olvidado NO se re-aprende solo. Únicamente las charlas futuras
-- vuelven a escribir memoria.
CREATE OR REPLACE FUNCTION public.espejo_memoria_forget(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_n int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('success', false, 'error', 'unauthorized');
    END IF;
    DELETE FROM public.espejo_memoria WHERE clerk_user_id = p_clerk_user_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN json_build_object('success', true, 'existed', v_n > 0);
END $$;

-- ── 7) REESCRIBIR DESDE CERO (Tripulante, vía user-action) ───────────────────
-- Descarta la ficha Y las marcas → la próxima pasada del cron reconstruye la
-- memoria releyendo las charlas existentes (acotado al material reciente).
CREATE OR REPLACE FUNCTION public.espejo_memoria_regenerate(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('success', false, 'error', 'unauthorized');
    END IF;
    INSERT INTO public.espejo_memoria (clerk_user_id, ficha, enc, regen_requested, updated_at)
    VALUES (p_clerk_user_id, NULL, false, true, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        ficha           = NULL,
        enc             = false,
        regen_requested = true,
        updated_at      = now();
    UPDATE public.oraculo_conversations
       SET memoria_distilled_at = NULL
     WHERE clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('success', true);
END $$;

-- ── 8) LA FICHA VIVA gana la sección MEMORIA (get_espejo_context v2) ─────────
-- Cuerpo completo de 20260729 + la memoria destilada al final (descifrada aquí
-- adentro, solo si memoria_enabled y hay ficha). El edge la teje en su bloque.
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
    v_memo     boolean;
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
    v_memoria    text;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN jsonb_build_object('enabled', false);
    END IF;

    -- Interruptores (sin fila = defaults: campo sí, sueños no, memoria sí).
    BEGIN
        SELECT master_enabled, dreams_enabled, memoria_enabled
          INTO v_master, v_dreams, v_memo
        FROM espejo_context_prefs WHERE clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    v_master := COALESCE(v_master, true);
    v_dreams := COALESCE(v_dreams, false);
    v_memo   := COALESCE(v_memo, true);
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

    -- ── MEMORIA DE LARGO PLAZO (Fase D: lo que el Espejo aprendió) ─────────
    IF v_memo THEN
        BEGIN
            SELECT NULLIF(trim(left(public._oraculo_decrypt(m.ficha, m.enc), 3500)), '')
              INTO v_memoria
              FROM espejo_memoria m
             WHERE m.clerk_user_id = p_clerk_user_id;
        EXCEPTION WHEN OTHERS THEN v_memoria := NULL; END;
    END IF;

    -- ── ENSAMBLE ──────────────────────────────────────────────────────────
    v_out := jsonb_build_object('enabled', true, 'dreams_enabled', v_dreams,
                                'memoria_enabled', v_memo);

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
    IF v_memoria IS NOT NULL THEN
        v_out := v_out || jsonb_build_object('memoria', v_memoria);
    END IF;

    RETURN v_out;
END $$;

-- ── 9) Prefs: el setter y el lector ganan el interruptor de memoria ──────────
-- La firma cambia → DROP + CREATE (PostgREST resuelve por el set de params;
-- los llamadores viejos con 2-3 params nombrados siguen resolviendo por los
-- DEFAULT — el cliente de la app viva NO se rompe).
DROP FUNCTION IF EXISTS public.set_espejo_context_prefs(text, boolean, boolean);
CREATE OR REPLACE FUNCTION public.set_espejo_context_prefs(
    p_clerk_user_id text,
    p_master boolean DEFAULT NULL,
    p_dreams boolean DEFAULT NULL,
    p_memoria boolean DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    INSERT INTO public.espejo_context_prefs (clerk_user_id, master_enabled, dreams_enabled, memoria_enabled, updated_at)
    VALUES (p_clerk_user_id, COALESCE(p_master, true), COALESCE(p_dreams, false), COALESCE(p_memoria, true), now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        master_enabled  = COALESCE(p_master,  espejo_context_prefs.master_enabled),
        dreams_enabled  = COALESCE(p_dreams,  espejo_context_prefs.dreams_enabled),
        memoria_enabled = COALESCE(p_memoria, espejo_context_prefs.memoria_enabled),
        updated_at      = now();
    RETURN json_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION public.get_espejo_context_prefs(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_master boolean;
    v_dreams boolean;
    v_memo   boolean;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('master_enabled', true, 'dreams_enabled', false,
                                 'memoria_enabled', true);
    END IF;

    BEGIN
        SELECT master_enabled, dreams_enabled, memoria_enabled
          INTO v_master, v_dreams, v_memo
          FROM public.espejo_context_prefs
         WHERE clerk_user_id = p_clerk_user_id;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN json_build_object(
        'master_enabled',  COALESCE(v_master, true),
        'dreams_enabled',  COALESCE(v_dreams, false),
        'memoria_enabled', COALESCE(v_memo, true)
    );
END $$;

-- ── 10) Borrado de cuenta: la memoria entra al purge (Apple 5.1.1) ───────────
-- Cuerpo verbatim de 20260727b + 'espejo_memoria' en la lista (la RPC es
-- tolerante: cada tabla en su propio bloque; una que falle no frena el resto).
CREATE OR REPLACE FUNCTION public.purge_my_account_data(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tables text[] := ARRAY[
        -- lo que ya borraba la edge
        'scan_vibracional','sonda_progress','decoder_scans',
        'estado_tripulante_protocolos','cristales_extraccion','meditaciones_owned',
        'reading_progress','navegante_progress','email_dispatches',
        -- lo íntimo que quedaba fuera
        'bitacora_notas','rachas','dream_records','dream_scans',
        'oraculo_messages','oraculo_conversations','oraculo_usage',
        'espejo_memoria','espejo_context_prefs',
        'vision_board','vision_answers','vision_photos','vision_versions',
        'vision_sessions','matter_jobs','crop_decodes',
        -- ritual, plan de vuelo y progreso
        'daily_checkins','daily_ritual_config','ritual_personalizado',
        'ritual_user_afirmaciones_custom','ritual_user_afirmaciones_sel',
        'day_tasks','medal_unlocks','user_crystal_owned','user_crystal_state',
        'ciudad_luz_estado',
        -- comunidad e identidad pública
        'community_profiles','community_profile_interests',
        -- avisos, telemetría y preferencias
        'push_tokens','notif_prefs','radar_ready_notified','nav_events',
        'wallpaper_downloads','voice_transcript_usage','app_feedback',
        'gift_offers','analisis_profundo'
    ];
    v_t       text;
    v_n       int;
    v_deleted json[] := '{}';
    v_total   int := 0;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) < 3 THEN
        RETURN json_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    FOREACH v_t IN ARRAY v_tables LOOP
        BEGIN
            IF to_regclass('public.' || quote_ident(v_t)) IS NULL THEN
                CONTINUE;
            END IF;
            EXECUTE format(
                'DELETE FROM public.%I WHERE clerk_user_id = $1', v_t
            ) USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            IF v_n > 0 THEN
                v_total := v_total + v_n;
                v_deleted := v_deleted || json_build_object('t', v_t, 'n', v_n);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Una tabla con otra columna de dueño o con una FK no debe abortar
            -- el resto del borrado. Se reporta y se sigue.
            v_deleted := v_deleted || json_build_object('t', v_t, 'err', SQLERRM);
        END;
    END LOOP;

    -- Los mensajes privados: se borran los que ESTA persona envió. Los que
    -- recibió pertenecen también al otro participante, así que su conversación
    -- no se destruye; la identidad ya se anonimiza al borrar community_profiles.
    BEGIN
        IF to_regclass('public.dm_messages') IS NOT NULL THEN
            EXECUTE 'DELETE FROM public.dm_messages WHERE sender_clerk_id = $1'
                USING p_clerk_user_id;
            GET DIAGNOSTICS v_n = ROW_COUNT;
            v_total := v_total + v_n;
            v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'n', v_n);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || json_build_object('t', 'dm_messages', 'err', SQLERRM);
    END;

    RETURN json_build_object('ok', true, 'total', v_total, 'detail', array_to_json(v_deleted));
END $$;

-- ── GRANTS — TODA la familia es service_role-only ────────────────────────────
-- 🜂 Regla del proyecto: un CREATE OR REPLACE re-otorga a PUBLIC lo que un
-- REVOKE cerró → se re-afirma TODO lo tocado en esta migración, incluida la
-- familia del contexto vivo (get_espejo_context se re-creó arriba).
REVOKE ALL ON FUNCTION public._espejo_memoria_encrypt_tg() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.espejo_memoria_scan_targets(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.espejo_memoria_scan_targets(integer) TO service_role;
REVOKE ALL ON FUNCTION public.espejo_memoria_get_material(text, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.espejo_memoria_get_material(text, uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public.espejo_memoria_commit(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.espejo_memoria_commit(text, text, jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.espejo_memoria_forget(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.espejo_memoria_forget(text) TO service_role;
REVOKE ALL ON FUNCTION public.espejo_memoria_regenerate(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.espejo_memoria_regenerate(text) TO service_role;
REVOKE ALL ON FUNCTION public.get_espejo_context(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_espejo_context(text) TO service_role;
REVOKE ALL ON FUNCTION public.set_espejo_context_prefs(text, boolean, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_espejo_context_prefs(text, boolean, boolean, boolean) TO service_role;
REVOKE ALL ON FUNCTION public.get_espejo_context_prefs(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_espejo_context_prefs(text) TO service_role;
REVOKE ALL ON FUNCTION public.purge_my_account_data(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.purge_my_account_data(text) TO service_role;

NOTIFY pgrst, 'reload schema';

-- ═════════════════════════════════════════════════════════════════════
-- CRON CADA 4 HORAS — pegar SÓLO después de:
--   (a) desplegar la edge:  supabase functions deploy espejo-destilador --no-verify-jwt
--   (b) setear el secreto:  supabase secrets set ESPEJO_MEMORIA_SECRET="<una-cadena-larga-al-azar>"
-- Las extensiones pg_cron + pg_net ya están activas (las usa crop-circles-scan).
-- Corre al minuto 25 de cada 4 horas. Reemplaza <ESPEJO_MEMORIA_SECRET> por el
-- MISMO valor del secreto de arriba.
-- ═════════════════════════════════════════════════════════════════════
--
-- SELECT cron.schedule(
--     'espejo-destilador-4h',
--     '25 */4 * * *',
--     $cron$
--     SELECT net.http_post(
--         url     := 'https://cobtsltrcsruzcusyqhi.supabase.co/functions/v1/espejo-destilador',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'x-cron-secret', '<ESPEJO_MEMORIA_SECRET>'
--         ),
--         body    := jsonb_build_object('source', 'cron'),
--         timeout_milliseconds := 120000
--     );
--     $cron$
-- );
--
-- Para quitarlo:  SELECT cron.unschedule('espejo-destilador-4h');
-- Para ver los jobs:  SELECT * FROM cron.job;
