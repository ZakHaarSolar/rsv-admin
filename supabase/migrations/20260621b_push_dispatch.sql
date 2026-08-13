-- Red Solar Viva · NOTIFICACIONES PUSH · Fase 2 — Disparadores (DM + Radar)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Requiere: 20260621_push_tokens.sql ya aplicado + la edge `send-push`
-- desplegada + el secreto compartido en Vault (ver "SECRETO" abajo).
--
-- Dos disparos de push, ambos vía la helper _push_dispatch → net.http_post a la
-- edge `send-push` (firma el JWT APNs y entrega a Apple):
--   1) MENSAJE NUEVO: trigger AFTER INSERT en dm_messages → notifica al OTRO
--      participante ("{alias} · Te envió un mensaje"). NO viaja el cuerpo del
--      mensaje (los cuerpos están cifrados en reposo; el push solo avisa).
--   2) RADAR LISTO: pg_cron diario → detecta a quién se le venció el cooldown
--      de 7 días desde su último ciclo COMPLETO y aún no fue avisado.
--
-- Robustez: _push_dispatch SWALLOWS cualquier error (pg_net ausente, secreto
-- sin setear, edge caída) → un push fallido NUNCA rompe el envío de un mensaje
-- ni la corrida del cron.

-- ════════════════════════════════════════════════════════════════════
-- SECRETO COMPARTIDO  (correr UNA vez; reemplazá <VALOR> por una cadena random)
-- ════════════════════════════════════════════════════════════════════
--   El MISMO valor va en dos lugares: Vault (lo lee este SQL) y el secreto
--   de la edge (lo valida send-push). Generá uno con: openssl rand -hex 32
--
--   -- 1) en SQL Editor:
--   SELECT vault.create_secret('<VALOR>', 'push_dispatch_secret');
--   -- 2) en la terminal (deploy de la edge):
--   supabase secrets set PUSH_DISPATCH_SECRET='<VALOR>'
--
--   Mientras el secreto NO exista, los disparos se saltan en silencio (la app
--   sigue funcionando, solo que sin push).
--
-- ⚠️ Si `CREATE EXTENSION` de abajo da un error de permisos, activá primero
--    pg_net y pg_cron desde Dashboard → Database → Extensions (toggle) y volvé
--    a correr este SQL. (pg_cron ya está activo por el cron de reservas.)

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ════════════════════════════════════════════════════════════════════
-- HELPER: entrega un push a TODOS los dispositivos del Tripulante.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._push_dispatch(
    p_clerk_user_id text,
    p_title text,
    p_body  text,
    p_data  jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
    v_url    text := 'https://cobtsltrcsruzcusyqhi.supabase.co/functions/v1/send-push';
    v_secret text;
BEGIN
    -- Nadie a quién mandar → no gastamos una llamada HTTP.
    IF p_clerk_user_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM push_tokens WHERE clerk_user_id = p_clerk_user_id) THEN
        RETURN;
    END IF;

    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'push_dispatch_secret' LIMIT 1;
    -- Secreto sin configurar todavía → no disparamos (la app no se rompe).
    IF v_secret IS NULL OR length(v_secret) = 0 THEN RETURN; END IF;

    PERFORM net.http_post(
        url     := v_url,
        body    := jsonb_build_object(
            'clerk_user_id', p_clerk_user_id,
            'title', p_title,
            'body',  p_body,
            'data',  COALESCE(p_data, '{}'::jsonb)
        ),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-dispatch-secret', v_secret
        ),
        timeout_milliseconds := 5000
    );
EXCEPTION WHEN OTHERS THEN
    -- Cualquier fallo (pg_net ausente, vault, red) se ignora: el push es
    -- best-effort, jamás debe abortar la transacción que lo originó.
    RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._push_dispatch(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public._push_dispatch(text, text, text, jsonb) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 1) MENSAJE NUEVO — trigger AFTER INSERT en dm_messages.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._dm_notify_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recipient text;
    v_alias     text;
BEGIN
    -- El destinatario es el participante que NO envió.
    SELECT CASE WHEN c.user_a = NEW.sender_clerk_id THEN c.user_b ELSE c.user_a END
    INTO v_recipient
    FROM dm_conversations c
    WHERE c.id = NEW.conversation_id;

    IF v_recipient IS NULL OR v_recipient = NEW.sender_clerk_id THEN
        RETURN NEW;
    END IF;

    -- Nombre del remitente (alias de comunidad = su nombre de identidad).
    SELECT NULLIF(TRIM(alias), '') INTO v_alias
    FROM community_profiles WHERE clerk_user_id = NEW.sender_clerk_id;

    PERFORM public._push_dispatch(
        v_recipient,
        COALESCE(v_alias, 'Un Tripulante'),
        'Te envió un mensaje',
        jsonb_build_object('type', 'dm', 'conversation_id', NEW.conversation_id)
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- El push jamás debe impedir que el mensaje se guarde.
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dm_notify ON public.dm_messages;
CREATE TRIGGER trg_dm_notify
    AFTER INSERT ON public.dm_messages
    FOR EACH ROW EXECUTE FUNCTION public._dm_notify_recipient();

-- ════════════════════════════════════════════════════════════════════
-- 2) RADAR LISTO — función + cron diario.
-- ════════════════════════════════════════════════════════════════════
-- Detecta el ÚLTIMO ciclo COMPLETO (6/6 pilares) de cada Tripulante y, si su
-- cooldown de 7 días acaba de vencer (ventana 7–14 días, para no avisar a
-- nodos dormidos hace meses) y aún no se le avisó ese ciclo, le manda un push.
-- "Ciclo completo" = cycle_scanned_json contiene los 6 pilares (LIKE robusto,
-- sin castear a jsonb que crashea con TEXT — ver gotcha jsonb_typeof).
CREATE OR REPLACE FUNCTION public.notify_radar_ready()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r     record;
    n_sent int := 0;
BEGIN
    FOR r IN
        WITH last_complete AS (
            SELECT sv.clerk_user_id, MAX(sv.created_at) AS cycle_ts
            FROM scan_vibracional sv
            -- Membresía EXACTA del pilar: el JSON es ["fisico","mental",...] →
            -- buscamos el token ENTRE COMILLAS ('%"fisico"%') para no matchear
            -- por substring accidental. Se queda como TEXT (sin cast a jsonb,
            -- que crashea con TEXT — gotcha jsonb_typeof).
            WHERE sv.cycle_scanned_json LIKE '%"fisico"%'
              AND sv.cycle_scanned_json LIKE '%"mental"%'
              AND sv.cycle_scanned_json LIKE '%"emocional"%'
              AND sv.cycle_scanned_json LIKE '%"financiero"%'
              AND sv.cycle_scanned_json LIKE '%"vector"%'
              AND sv.cycle_scanned_json LIKE '%"orbita"%'
            GROUP BY sv.clerk_user_id
        )
        SELECT lc.clerk_user_id, lc.cycle_ts
        FROM last_complete lc
        -- La VENTANA es amplia (7–90 días) a propósito: el dedupe
        -- (radar_ready_notified) es el único guard anti-spam; la cota superior
        -- SOLO evita despertar nodos dormidos hace meses. Amplia = el cron
        -- diario tiene 83 días de margen para alcanzar a cada quien aunque
        -- falle algún día → sin el agujero de "ventana de 7 días perdida".
        WHERE now() - lc.cycle_ts >= interval '7 days'
          AND now() - lc.cycle_ts <  interval '90 days'
          -- Solo a quien tiene un dispositivo registrado: así no marcamos como
          -- "avisado" a un nodo sin token (lo avisaríamos cuando registre uno,
          -- mientras siga en la ventana de 7–14 días).
          AND EXISTS (
              SELECT 1 FROM push_tokens pt
              WHERE pt.clerk_user_id = lc.clerk_user_id
          )
          AND NOT EXISTS (
              SELECT 1 FROM radar_ready_notified rn
              WHERE rn.clerk_user_id = lc.clerk_user_id
                AND rn.cycle_ts = lc.cycle_ts
          )
    LOOP
        BEGIN
            PERFORM public._push_dispatch(
                r.clerk_user_id,
                'Tu Radar está listo ✦',
                'Pasaron 7 días: tu nuevo escaneo del campo te espera.',
                jsonb_build_object('type', 'radar')
            );
            INSERT INTO radar_ready_notified (clerk_user_id, cycle_ts)
            VALUES (r.clerk_user_id, r.cycle_ts)
            ON CONFLICT (clerk_user_id, cycle_ts) DO NOTHING;
            n_sent := n_sent + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Un nodo que falla no aborta el resto del barrido.
            NULL;
        END;
    END LOOP;

    RETURN n_sent;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_radar_ready() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.notify_radar_ready() TO service_role;

-- pg_cron: una corrida diaria a las 16:00 UTC (~11:00 en Cancún, UTC-5).
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
    PERFORM cron.unschedule('radar-ready-notify');
EXCEPTION WHEN OTHERS THEN
    NULL;
END$$;
SELECT cron.schedule(
    'radar-ready-notify',
    '0 16 * * *',
    $$ SELECT public.notify_radar_ready(); $$
);

-- Verificar (opcional):
--   SELECT public.notify_radar_ready();            -- corre el barrido ahora
--   SELECT * FROM cron.job WHERE jobname = 'radar-ready-notify';
