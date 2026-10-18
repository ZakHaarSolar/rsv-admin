-- Red Solar Viva · EL FRENO DE REGISTROS DE LA WEB GUARDA SOLO LA HUELLA DE SU SECRETO (2026-10-18)
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run. Idempotente.
--
-- El secreto que el proxy /api/fapi (escaner-app, Vercel) le presenta al libro
-- de intentos quedó escrito en ✅ 20260806d_freno_registros_web.sql, que vive en
-- git. Se rotó: el nuevo vive SOLO en Vercel (RSV_FRENO_SECRET, producción) y en
-- el llavero de la Mac (rsv-freno-web). La base ya no guarda el secreto: guarda
-- su huella sha256 y compara la huella de lo que llega, así que este archivo
-- puede vivir en git sin riesgo (de la huella no se saca el secreto).
--
-- Próxima rotación, igual: un secreto nuevo en el llavero y en Vercel (y
-- publicar la web), y su huella aquí con vault.update_secret.
-- Mientras la base y Vercel no coinciden, el freno deja pasar a todos, como
-- siempre: nadie se queda sin poder registrarse.

-- ── (1) El libro de intentos compara la huella ────────────────────────
-- registrar_intento_web copiada tal cual de producción (2026-10-18); solo
-- cambia la comparación del secreto.
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

    -- 🜂 (2026-10-18) La bóveda guarda la HUELLA sha256 del secreto, no el
    -- secreto: se compara la huella de lo que llega.
    IF v_key IS NULL OR p_secret IS NULL
       OR encode(sha256(convert_to(p_secret, 'UTF8')), 'hex') <> v_key THEN
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
END $function$;

REVOKE ALL ON FUNCTION public.registrar_intento_web(text, text, text, text, int, int, int)
    FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_intento_web(text, text, text, text, int, int, int)
    TO anon;

-- ── (2) La huella del secreto vigente (rotado el 2026-10-18) ──────────
DO $$
DECLARE
    v_huella constant text := '1063cc7b04f90448b7c60fbd1703a26b8ef19f06d1b1aa00c5fca311bb89d503';
    v_desc   constant text := 'Huella sha256 de RSV_FRENO_SECRET (Vercel, escaner-app). El secreto vive solo en Vercel y en el llavero de la Mac (rsv-freno-web).';
BEGIN
    IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'web_auth_freno_key') THEN
        PERFORM vault.update_secret(
            (SELECT id FROM vault.secrets WHERE name = 'web_auth_freno_key'),
            v_huella, NULL, v_desc
        );
    ELSE
        PERFORM vault.create_secret(v_huella, 'web_auth_freno_key', v_desc);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
