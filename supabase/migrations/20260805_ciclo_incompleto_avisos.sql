-- Red Solar Viva · AVISO DE CICLO A MEDIAS  (Día 1 · Día 3)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere: 20260621_push_tokens + 20260621b_push_dispatch ya aplicados.
--
-- QUÉ HACE
--   A quien EMPEZÓ un ciclo del Radar y dejó pilares sin sellar le llega un
--   recordatorio al día siguiente y otro a los tres días. Dos, y ahí muere.
--
-- POR QUÉ ASÍ
--   Lo incompleto genera tensión real y esa tensión sí mueve: hay un
--   compromiso abierto y el mensaje puede ser CONCRETO ("llevas 4 de 6",
--   "solo falta VÍNCULOS"). El número es lo que da tracción; un "no olvides
--   escanear" no dice nada y se descarta.
--   Nada de aviso diario: dos toques y silencio hasta que retome o cierre.
--   Y el aviso de "tu Radar está listo" (notify_radar_ready) es otra cosa,
--   para ciclos YA cerrados que cumplieron sus 7 días. Nunca se pisan: este
--   solo mira ciclos con 1 a 5 pilares, aquel solo ciclos de 6.
--
-- CÓMO SE MIDE EL CICLO EN CURSO
--   Cada pilar sellado escribe una fila NUEVA en scan_vibracional con el
--   conjunto ACUMULADO en cycle_scanned_json (columna TEXT, no jsonb — ver
--   gotcha jsonb_typeof). Entonces:
--     · la última fila de cada Tripulante dice en qué punto va;
--     · si tiene de 1 a 5 pilares, el ciclo está a medias;
--     · el ARRANQUE de ese ciclo es la última fila suya con exactamente 1
--       pilar (el contador vuelve a 1 solo cuando empieza uno nuevo).
--   El arranque es la llave del dedupe: máximo 2 avisos POR CICLO, aunque
--   entre medio selle otro pilar y el reloj de inactividad se reinicie.
--
-- RELOJ
--   Se cuenta desde el ÚLTIMO pilar sellado (la última señal de vida), no
--   desde el arranque: quien sella uno por día nunca está inactivo y nunca
--   recibe nada. El barrido corre 1×/día a las 17:00 UTC (~12:00 en Cancún).

-- ════════════════════════════════════════════════════════════════════
-- 0) IDIOMA DEL APARATO — para que el aviso llegue en el idioma de la app.
-- ════════════════════════════════════════════════════════════════════
-- La app ya vive en es/en; los avisos, hasta hoy, solo en español. El idioma
-- viaja con el token (es un dato del APARATO, no de la cuenta: el mismo
-- Tripulante puede tener el iPhone en inglés y el iPad en español).
ALTER TABLE public.push_tokens
    ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'es';

-- register_push_token gana p_lang (opcional → los builds ya publicados, que
-- no lo mandan, siguen funcionando exactamente igual y caen en 'es').
-- ⚠️ Se DROPEA la firma vieja de 3 argumentos: agregar un parámetro con
-- default crea una SOBRECARGA, y una llamada de 3 argumentos matchearía las
-- dos → "function is not unique". Tiene que quedar una sola.
DROP FUNCTION IF EXISTS public.register_push_token(text, text, text);

CREATE OR REPLACE FUNCTION public.register_push_token(
    p_clerk_user_id text,
    p_token         text,
    p_platform      text DEFAULT 'ios',
    p_lang          text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token text := TRIM(COALESCE(p_token, ''));
    v_plat  text := LOWER(TRIM(COALESCE(p_platform, 'ios')));
    v_lang  text := LOWER(LEFT(TRIM(COALESCE(p_lang, '')), 2));
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RETURN json_build_object('error', 'no_user');
    END IF;
    IF length(v_token) = 0 THEN
        RETURN json_build_object('error', 'no_token');
    END IF;
    IF v_plat NOT IN ('ios', 'android') THEN v_plat := 'ios'; END IF;
    IF v_lang NOT IN ('es', 'en') THEN v_lang := NULL; END IF;

    INSERT INTO push_tokens (token, clerk_user_id, platform, lang, updated_at)
    VALUES (v_token, p_clerk_user_id, v_plat, COALESCE(v_lang, 'es'), now())
    ON CONFLICT (token) DO UPDATE
        SET clerk_user_id = EXCLUDED.clerk_user_id,
            platform      = EXCLUDED.platform,
            -- Sin idioma declarado se CONSERVA el que hubiera (un build viejo
            -- registrando no debe borrar lo que uno nuevo ya dijo).
            lang          = COALESCE(v_lang, push_tokens.lang),
            updated_at    = now();

    RETURN json_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_push_token(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.register_push_token(text, text, text, text) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 1) HELPERS de lectura del ciclo (cycle_scanned_json es TEXT).
-- ════════════════════════════════════════════════════════════════════
-- Cuántos de los 6 pilares están sellados en ese conjunto. Se busca el token
-- ENTRE COMILLAS para no matchear por substring accidental.
CREATE OR REPLACE FUNCTION public._pilares_en(p_json text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE WHEN COALESCE(p_json, '') = '' THEN 0 ELSE
        (CASE WHEN p_json LIKE '%"fisico"%'     THEN 1 ELSE 0 END) +
        (CASE WHEN p_json LIKE '%"mental"%'     THEN 1 ELSE 0 END) +
        (CASE WHEN p_json LIKE '%"emocional"%'  THEN 1 ELSE 0 END) +
        (CASE WHEN p_json LIKE '%"financiero"%' THEN 1 ELSE 0 END) +
        (CASE WHEN p_json LIKE '%"vector"%'     THEN 1 ELSE 0 END) +
        (CASE WHEN p_json LIKE '%"orbita"%'     THEN 1 ELSE 0 END)
    END;
$$;

-- El nombre del pilar que falta, en el idioma pedido. Solo tiene sentido
-- cuando falta UNO (con 5 sellados); con más devuelve el primero pendiente
-- en el orden del hexágono, que no se usa en el copy.
CREATE OR REPLACE FUNCTION public._pilar_faltante(p_json text, p_lang text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_en boolean := LOWER(COALESCE(p_lang, 'es')) = 'en';
    v    text     := COALESCE(p_json, '');
BEGIN
    IF v NOT LIKE '%"fisico"%'     THEN RETURN CASE WHEN v_en THEN 'BODY'        ELSE 'CUERPO'    END; END IF;
    IF v NOT LIKE '%"mental"%'     THEN RETURN CASE WHEN v_en THEN 'MIND'        ELSE 'MENTE'     END; END IF;
    IF v NOT LIKE '%"emocional"%'  THEN RETURN CASE WHEN v_en THEN 'EMOTIONS'    ELSE 'EMOCIONES' END; END IF;
    IF v NOT LIKE '%"financiero"%' THEN RETURN CASE WHEN v_en THEN 'ABUNDANCE'   ELSE 'ABUNDANCIA'END; END IF;
    IF v NOT LIKE '%"vector"%'     THEN RETURN CASE WHEN v_en THEN 'PURPOSE'     ELSE 'PROPÓSITO' END; END IF;
    IF v NOT LIKE '%"orbita"%'     THEN RETURN CASE WHEN v_en THEN 'CONNECTIONS' ELSE 'VÍNCULOS'  END; END IF;
    RETURN '';
END;
$$;

-- Higiene: los dos helpers solo miran una cadena que se les pasa (no tocan
-- datos), pero la regla de la casa es que nada nuevo quede abierto por defecto.
REVOKE EXECUTE ON FUNCTION public._pilares_en(text)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._pilar_faltante(text, text)    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public._pilares_en(text)              TO service_role;
GRANT  EXECUTE ON FUNCTION public._pilar_faltante(text, text)    TO service_role;

-- Índice para el DISTINCT ON del barrido (la última fila por Tripulante).
CREATE INDEX IF NOT EXISTS idx_scan_vibracional_user_fecha
    ON public.scan_vibracional (clerk_user_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════
-- 2) DEDUPE — una fila por (Tripulante, ciclo, etapa). Máximo 2 por ciclo.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ciclo_parcial_notified (
    clerk_user_id text        NOT NULL,
    cycle_ts      timestamptz NOT NULL,   -- arranque del ciclo (fila de 1 pilar)
    etapa         smallint    NOT NULL,   -- 1 = día siguiente · 3 = tres días
    notified_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, cycle_ts, etapa)
);
ALTER TABLE public.ciclo_parcial_notified ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ciclo_parcial_notified FROM PUBLIC, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3) EL BARRIDO
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_ciclo_incompleto()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r        record;
    v_lang   text;
    v_faltan int;
    v_pilar  text;
    v_titulo text;
    v_cuerpo text;
    n_sent   int := 0;
BEGIN
    FOR r IN
        WITH ultima AS (
            -- Dónde va cada Tripulante ahora mismo.
            SELECT DISTINCT ON (sv.clerk_user_id)
                   sv.clerk_user_id,
                   sv.created_at                        AS last_ts,
                   sv.cycle_scanned_json                AS cycle_json,
                   public._pilares_en(sv.cycle_scanned_json) AS n
            FROM scan_vibracional sv
            WHERE COALESCE(sv.cycle_scanned_json, '') <> ''
            ORDER BY sv.clerk_user_id, sv.created_at DESC
        ),
        parcial AS (
            -- Ciclo A MEDIAS: ni recién nacido en cero ni cerrado en 6.
            SELECT * FROM ultima WHERE n BETWEEN 1 AND 5
        ),
        conInicio AS (
            SELECT p.*,
                   (SELECT MAX(sv2.created_at)
                      FROM scan_vibracional sv2
                     WHERE sv2.clerk_user_id = p.clerk_user_id
                       AND sv2.created_at <= p.last_ts
                       AND public._pilares_en(sv2.cycle_scanned_json) = 1
                   ) AS cycle_ts
            FROM parcial p
        )
        SELECT c.clerk_user_id,
               c.cycle_ts,
               c.cycle_json,
               c.n,
               -- Etapa que toca: la de 3 días manda si ya se cumplieron.
               CASE WHEN now() - c.last_ts >= interval '3 days' THEN 3 ELSE 1 END AS etapa
        FROM conInicio c
        WHERE c.cycle_ts IS NOT NULL
          -- Día siguiente: 20 h desde el último pilar. Con el barrido a las
          -- 17:00 UTC, alcanza a todo el que selló antes de las 21:00 del día
          -- anterior; el resto entra en la corrida siguiente.
          AND now() - c.last_ts >= interval '20 hours'
          -- Un ciclo abandonado hace un mes ya no es un compromiso abierto:
          -- insistirle es ruido, no tracción.
          AND now() - c.last_ts < interval '30 days'
          AND EXISTS (
              SELECT 1 FROM push_tokens pt
              WHERE pt.clerk_user_id = c.clerk_user_id
          )
          -- Quien apagó los avisos del escaneo en Ajustes no recibe ninguno.
          AND NOT EXISTS (
              SELECT 1 FROM notif_prefs np
              WHERE np.clerk_user_id = c.clerk_user_id
                AND (np.prefs->>'scan_weekly')::boolean IS FALSE
          )
          AND NOT EXISTS (
              SELECT 1 FROM ciclo_parcial_notified cn
              WHERE cn.clerk_user_id = c.clerk_user_id
                AND cn.cycle_ts = c.cycle_ts
                AND cn.etapa = CASE WHEN now() - c.last_ts >= interval '3 days' THEN 3 ELSE 1 END
          )
    LOOP
        BEGIN
            -- Idioma del aparato registrado más recientemente.
            SELECT pt.lang INTO v_lang
            FROM push_tokens pt
            WHERE pt.clerk_user_id = r.clerk_user_id
            ORDER BY pt.updated_at DESC
            LIMIT 1;
            IF v_lang IS NULL OR v_lang NOT IN ('es', 'en') THEN v_lang := 'es'; END IF;

            v_faltan := 6 - r.n;
            v_pilar  := public._pilar_faltante(r.cycle_json, v_lang);

            -- ── EL MENSAJE. Siempre con el número. Cuando falta UNO se dice
            --    CUÁL: es la diferencia entre una tarea y un último paso.
            IF v_lang = 'en' THEN
                IF r.n = 5 THEN
                    v_titulo := 'One pillar left ✦';
                    v_cuerpo := CASE WHEN r.etapa = 3
                        THEN 'Your reading has been waiting three days for ' || v_pilar || '. It takes about four minutes.'
                        ELSE 'You are at 5 of 6. Only ' || v_pilar || ' is missing and your Light Index is complete.' END;
                ELSIF r.n >= 3 THEN
                    v_titulo := CASE WHEN r.etapa = 3 THEN 'Your reading is still open' ELSE 'You are at ' || r.n || ' of 6 ✦' END;
                    v_cuerpo := 'Your field is half read. ' || v_faltan || ' pillars left, about four minutes each. Pick up where you left off.';
                ELSE
                    v_titulo := CASE WHEN r.etapa = 3 THEN 'Your reading is still open' ELSE 'You began your reading ✦' END;
                    v_cuerpo := 'You are at ' || r.n || ' of 6 pillars. Each one takes about four minutes and nothing you sealed is lost.';
                END IF;
            ELSE
                IF r.n = 5 THEN
                    v_titulo := 'Te falta un pilar ✦';
                    v_cuerpo := CASE WHEN r.etapa = 3
                        THEN 'Tu lectura lleva tres días esperando ' || v_pilar || '. Son unos cuatro minutos.'
                        ELSE 'Llevas 5 de 6. Solo falta ' || v_pilar || ' y tu Índice de Luz queda completo.' END;
                ELSIF r.n >= 3 THEN
                    v_titulo := CASE WHEN r.etapa = 3 THEN 'Tu lectura sigue abierta' ELSE 'Llevas ' || r.n || ' de 6 ✦' END;
                    v_cuerpo := 'Tu campo está a medio leer. Te faltan ' || v_faltan || ' pilares, unos cuatro minutos cada uno. Retómala donde la dejaste.';
                ELSE
                    v_titulo := CASE WHEN r.etapa = 3 THEN 'Tu lectura sigue abierta' ELSE 'Empezaste tu lectura ✦' END;
                    v_cuerpo := 'Llevas ' || r.n || ' de 6 pilares. Cada uno toma unos cuatro minutos y nada de lo que sellaste se pierde.';
                END IF;
            END IF;

            PERFORM public._push_dispatch(
                r.clerk_user_id,
                v_titulo,
                v_cuerpo,
                jsonb_build_object('type', 'radar', 'etapa', r.etapa, 'pilares', r.n)
            );
            INSERT INTO ciclo_parcial_notified (clerk_user_id, cycle_ts, etapa)
            VALUES (r.clerk_user_id, r.cycle_ts, r.etapa)
            ON CONFLICT (clerk_user_id, cycle_ts, etapa) DO NOTHING;
            n_sent := n_sent + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Un nodo que falla no aborta el resto del barrido.
            NULL;
        END;
    END LOOP;

    RETURN n_sent;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_ciclo_incompleto() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.notify_ciclo_incompleto() TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 4) CRON — 17:00 UTC (~12:00 en Cancún), una hora después del de "Radar
--    listo" para que nunca salgan los dos en el mismo minuto.
-- ════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
    PERFORM cron.unschedule('ciclo-incompleto-notify');
EXCEPTION WHEN OTHERS THEN
    NULL;
END$$;
SELECT cron.schedule(
    'ciclo-incompleto-notify',
    '0 17 * * *',
    $$ SELECT public.notify_ciclo_incompleto(); $$
);

-- ── Verificar (opcional) ────────────────────────────────────────────────
--   A quién le tocaría AHORA (sin mandar nada):
--     SELECT DISTINCT ON (sv.clerk_user_id) sv.clerk_user_id,
--            public._pilares_en(sv.cycle_scanned_json) AS pilares,
--            round(EXTRACT(EPOCH FROM (now() - sv.created_at))/3600)::int AS horas
--     FROM scan_vibracional sv
--     WHERE COALESCE(sv.cycle_scanned_json,'') <> ''
--     ORDER BY sv.clerk_user_id, sv.created_at DESC;
--   Correr el barrido a mano:  SELECT public.notify_ciclo_incompleto();
--   Ver los avisos mandados:   SELECT * FROM ciclo_parcial_notified ORDER BY notified_at DESC LIMIT 20;
--   Ver el trabajo agendado:   SELECT * FROM cron.job WHERE jobname = 'ciclo-incompleto-notify';
