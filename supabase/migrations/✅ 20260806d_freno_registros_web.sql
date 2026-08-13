-- Red Solar Viva · FRENO DE REGISTROS AUTOMÁTICOS EN LA WEB
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- ── EL AGUJERO (medido en vivo el 2026-08-06) ────────────────────────────────
-- En app.escanervibracional.com clerk-js corre en modo nativo y TODO su tráfico
-- de identificación pasa por nuestro proxy same-origin /api/fapi, que vive en
-- una función de Vercel en la región iad1 (Ashburn, Virginia). Medido con la
-- cabecera x-country que devuelve la propia FAPI:
--
--     pegando directo desde México  →  x-country: MX
--     pegando por nuestro proxy     →  x-country: US   (la IP de Vercel)
--
-- Es decir: Clerk ve la dirección de NUESTRO servidor, no la de la persona.
-- Sus defensas contra altas automáticas (que se apoyan en el origen para
-- distinguir mil intentos de una persona de mil personas distintas) quedan
-- ciegas para toda la web. Reenviar x-forwarded-for no alcanza: se midió que
-- Clerk lo ignora si no viene de un proxy registrado en su panel, que es la
-- conducta correcta de su lado (creerle el origen a cualquiera sería un hueco
-- de suplantación).
--
-- ── EL CIERRE ────────────────────────────────────────────────────────────────
-- El proxy es el punto de estrangulamiento perfecto: TODO pasa por ahí y él SÍ
-- ve la dirección real (Vercel se la entrega en x-real-ip / x-forwarded-for,
-- verificado). Esta migración le da memoria: un libro de intentos por origen y
-- una ventana de tiempo por tipo de acción.
--
-- ── PRIVACIDAD ───────────────────────────────────────────────────────────────
-- La dirección NO se guarda cruda: se almacena md5(direccion) como ip_key,
-- igual que el libro mayor de gasto de edges (edge_spend_ledger). Alcanza para
-- agrupar y ver un patrón; no alcanza para identificar a nadie.
--
-- ── FAIL-OPEN A PROPÓSITO ────────────────────────────────────────────────────
-- Ante CUALQUIER tropiezo (Vault mudo, credencial equivocada, error interno)
-- la respuesta es {ok:true}. Al revés que en la firma de la baja de correos,
-- acá el lado seguro del error es DEJAR PASAR: equivocarse hacia el "no" le
-- impide a una persona real crear su cuenta, que es el daño más caro que este
-- freno podría causar.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ── 1) El secreto compartido con el proxy ────────────────────────────────────
-- Espejo de la variable RSV_FRENO_SECRET del proyecto de Vercel (escaner-app).
-- Si algún día se rota, hay que rotarla en los DOS lados: acá y con
-- `vercel env rm/add RSV_FRENO_SECRET production` + redeploy.
DO $$
DECLARE v_secret text := '43a09f1e93ff859aa4720e990db99da0f8248b83dea24cbfbde733ea4ef26228';
BEGIN
    IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'web_auth_freno_key') THEN
        PERFORM vault.update_secret(
            (SELECT id FROM vault.secrets WHERE name = 'web_auth_freno_key'),
            v_secret
        );
    ELSE
        PERFORM vault.create_secret(
            v_secret,
            'web_auth_freno_key',
            'Credencial que el proxy /api/fapi presenta para registrar intentos de alta/ingreso en la web'
        );
    END IF;
END $$;

-- ── 2) El libro de intentos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_auth_attempts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_key     text NOT NULL,          -- md5(direccion), nunca la dirección
    accion     text NOT NULL,          -- registro | correo | ingreso | codigo
    pais       text,                   -- señal de contexto, no identidad
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waa_ip     ON web_auth_attempts (ip_key, accion, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waa_accion ON web_auth_attempts (accion, created_at DESC);

ALTER TABLE web_auth_attempts ENABLE ROW LEVEL SECURITY;  -- sin policies → nadie lee con la llave pública

-- ── 3) La reserva ────────────────────────────────────────────────────────────
-- Cuenta lo que ese origen lleva en la ventana, decide, y si pasa, registra.
-- Un límite en 0 significa "esa ventana no se evalúa".
CREATE OR REPLACE FUNCTION public.registrar_intento_web(
    p_secret             text,
    p_ip                 text,
    p_accion             text,
    p_pais               text DEFAULT NULL,
    p_limite_hora        int  DEFAULT 0,
    p_limite_dia         int  DEFAULT 0,
    p_limite_global_hora int  DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_key    text;
    v_ipkey  text;
    v_cuenta int;
BEGIN
    -- Sin credencial correcta no se registra nada y se deja pasar. Un extraño
    -- con la sola llave pública no puede ensuciar el libro ni gastarle la
    -- cuota a nadie.
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets WHERE name = 'web_auth_freno_key' LIMIT 1;

    IF v_key IS NULL OR p_secret IS NULL OR p_secret <> v_key THEN
        RETURN jsonb_build_object('ok', true, 'motivo', 'sin_credencial');
    END IF;

    IF p_ip IS NULL OR length(trim(p_ip)) = 0 THEN
        RETURN jsonb_build_object('ok', true, 'motivo', 'sin_origen');
    END IF;

    v_ipkey := md5(trim(p_ip));

    -- Ventana corta por origen
    IF p_limite_hora > 0 THEN
        SELECT count(*) INTO v_cuenta
        FROM web_auth_attempts
        WHERE ip_key = v_ipkey AND accion = p_accion
          AND created_at > now() - interval '1 hour';
        IF v_cuenta >= p_limite_hora THEN
            RETURN jsonb_build_object(
                'ok', false, 'motivo', 'limite_hora',
                'cuenta', v_cuenta, 'limite', p_limite_hora
            );
        END IF;
    END IF;

    -- Ventana larga por origen
    IF p_limite_dia > 0 THEN
        SELECT count(*) INTO v_cuenta
        FROM web_auth_attempts
        WHERE ip_key = v_ipkey AND accion = p_accion
          AND created_at > now() - interval '1 day';
        IF v_cuenta >= p_limite_dia THEN
            RETURN jsonb_build_object(
                'ok', false, 'motivo', 'limite_dia',
                'cuenta', v_cuenta, 'limite', p_limite_dia
            );
        END IF;
    END IF;

    -- Cortacircuitos general: una avalancha repartida entre muchos orígenes no
    -- la ve ninguna ventana por origen. Se deja holgado a propósito para no
    -- morder en un pico legítimo de difusión.
    IF p_limite_global_hora > 0 THEN
        SELECT count(*) INTO v_cuenta
        FROM web_auth_attempts
        WHERE accion = p_accion
          AND created_at > now() - interval '1 hour';
        IF v_cuenta >= p_limite_global_hora THEN
            RETURN jsonb_build_object(
                'ok', false, 'motivo', 'limite_global',
                'cuenta', v_cuenta, 'limite', p_limite_global_hora
            );
        END IF;
    END IF;

    INSERT INTO web_auth_attempts (ip_key, accion, pais)
    VALUES (v_ipkey, p_accion, nullif(trim(coalesce(p_pais, '')), ''));

    -- Limpieza oportunista: 1 de cada 100 llamadas barre lo viejo. Sin cron y
    -- sin que el libro crezca para siempre.
    IF random() < 0.01 THEN
        DELETE FROM web_auth_attempts WHERE created_at < now() - interval '7 days';
    END IF;

    RETURN jsonb_build_object('ok', true, 'motivo', 'registrado');

EXCEPTION WHEN OTHERS THEN
    -- Fail-open: un tropiezo de la base nunca le impide a alguien entrar.
    RETURN jsonb_build_object('ok', true, 'motivo', 'error_interno');
END $$;

REVOKE ALL ON FUNCTION public.registrar_intento_web(text,text,text,text,int,int,int)
    FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_intento_web(text,text,text,text,int,int,int)
    TO anon;

-- ── 4) Cómo mirar el patrón después ──────────────────────────────────────────
-- No hay panel a propósito (todavía no hay volumen que justifique construirlo).
-- Cuando haga falta ver qué está pasando, pegar esto en el SQL Editor:
--
--   -- Los orígenes más activos de las últimas 24 h
--   SELECT ip_key, accion, pais, count(*) AS intentos,
--          min(created_at) AS primero, max(created_at) AS ultimo
--   FROM web_auth_attempts
--   WHERE created_at > now() - interval '24 hours'
--   GROUP BY ip_key, accion, pais
--   ORDER BY intentos DESC
--   LIMIT 40;
--
--   -- Altas por hora (para ver la forma de una avalancha)
--   SELECT date_trunc('hour', created_at) AS hora, count(*)
--   FROM web_auth_attempts
--   WHERE accion = 'registro' AND created_at > now() - interval '7 days'
--   GROUP BY 1 ORDER BY 1 DESC;
