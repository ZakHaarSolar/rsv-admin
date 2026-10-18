CREATE OR REPLACE FUNCTION public.registrar_intento_web(p_secret text, p_ip text, p_accion text, p_pais text DEFAULT NULL::text, p_limite_hora integer DEFAULT 0, p_limite_dia integer DEFAULT 0, p_limite_global_hora integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
END $function$

;
